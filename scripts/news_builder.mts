/**
 * news_builder.mts — replaces the `news-builder` agent using the Gemini TTS API.
 *
 * Mirrors `.claude/agents/news-builder.md` + `_workspace/tts_gemini_full.py`:
 *   1. Reads the scenario file `_workspace/03_news_scenario.md`
 *   2. Parses the host(호스트)/reporter(리포터) speaker lines
 *   3. Synthesizes each speaker line with a DIFFERENT voice via Gemini TTS
 *      (default: host = `puck`, reporter = `charon`)
 *   4. Concatenates all clips back in original order and writes a SINGLE
 *      speech file to `_workspace/04_news_files/{week}_full_news.wav`
 *
 * Two-person speech: Gemini TTS only accepts ONE voice per request, so each
 * line is synthesized individually with its speaker's voice and then the audio
 * is concatenated in order. The output is still a single wav file.
 *
 * API key: read from `GEMINI_API_KEY` in `.env` (or `GEMINI_API_KEY` env var).
 * HOST_VOICE / REPORTER_VOICE (or --host-voice / --reporter-voice) pick the
 * two voices. Available Gemini TTS prebuilt voices include:
 *   Puck, Charon, Kore, Fenrir, Aoede, Zephyr, Calliope, Leda, Orus
 *
 * Run (from repo root):
 *   npx tsx scripts/news_builder.mts
 *   npx tsx scripts/news_builder.mts --host-voice=puck --reporter-voice=charon
 *   npx tsx scripts/news_builder.mts --input=_workspace/03_news_scenario.md --output=_workspace/04_news_files
 *   npx tsx scripts/news_builder.mts --single   # one TTS call, single voice (quota-friendly)
 */
import * as fsp from "node:fs/promises";
import * as fss from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
const ROOT = process.cwd();
const WORK = path.join(ROOT, "_workspace");
const DEFAULT_INPUT = path.join(WORK, "03_news_scenario.md");
const DEFAULT_OUTPUT_DIR = path.join(WORK, "04_news_files");

const DEFAULT_MODEL = "gemini-2.5-flash-preview-tts";
const DEFAULT_HOST_VOICE = "puck";
const DEFAULT_REPORTER_VOICE = "charon";

const WEEK_ORDINALS: Record<string, string> = {
  첫째: "w1", 둘째: "w2", 셋째: "w3", 넷째: "w4", 다섯째: "w5", 여섯째: "w6",
};

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

interface Options {
  input: string;
  outputDir: string;
  model: string;
  hostVoice: string;
  reporterVoice: string;
  single: boolean;
  voice: string;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    input: DEFAULT_INPUT,
    outputDir: DEFAULT_OUTPUT_DIR,
    model: process.env.GEMINI_TTS_MODEL ?? DEFAULT_MODEL,
    hostVoice: process.env.HOST_VOICE ?? DEFAULT_HOST_VOICE,
    reporterVoice: process.env.REPORTER_VOICE ?? DEFAULT_REPORTER_VOICE,
    single: false,
    voice: process.env.GEMINI_TTS_VOICE ?? "",
  };
  for (const a of argv) {
    if (a.startsWith("--input=")) opts.input = a.slice("--input=".length);
    else if (a.startsWith("--output=")) opts.outputDir = a.slice("--output=".length);
    else if (a.startsWith("--model=")) opts.model = a.slice("--model=".length);
    else if (a.startsWith("--host-voice=")) opts.hostVoice = a.slice("--host-voice=".length);
    else if (a.startsWith("--reporter-voice=")) opts.reporterVoice = a.slice("--reporter-voice=".length);
    else if (a.startsWith("--voice=")) opts.voice = a.slice("--voice=".length);
    else if (a === "--single") opts.single = true;
  }
  return opts;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Read the Gemini API key from `.env` (KEY=VALUE lines) or the environment. */
async function loadApiKey(): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const env = await fsp.readFile(path.join(ROOT, ".env"), "utf8");
    for (const raw of env.split("\n")) {
      const line = raw.trim();
      if (line.startsWith("GEMINI_API_KEY")) {
        const v = line.split("=", 2)[1].trim();
        return v.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env missing — fall through */
  }
  return null;
}

/** Derive the week prefix like `2026_08_w2` from the scenario's first line. */
async function weekPrefix(scenarioPath: string): Promise<string | null> {
  try {
    const first = (await fsp.readFile(scenarioPath, "utf8")).split("\n", 1)[0];
    const m = first.match(/(\d{4})년\s*(\d{1,2})월\s*([가-힣]+) 주/);
    if (m) {
      const w = WEEK_ORDINALS[m[3]] ?? "w1";
      return `${m[1]}_${String(parseInt(m[2], 10)).padStart(2, "0")}_${w}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Extract (speaker, text) pairs from `**호스트:** ...` / `**리포터:** ...` lines. */
function parseScenario(markdown: string): Array<[string, string]> {
  const lines: Array<[string, string]> = [];
  for (const raw of markdown.split("\n")) {
    const m = raw.trim().match(/^\*\*(호스트|리포터):\*\*\s*(.*)$/);
    if (m && m[2].trim()) lines.push([m[1], m[2].trim()]);
  }
  return lines;
}

/** Build the wav header for raw PCM L16/SAMPLE_RATE mono. */
function wavHeader(pcmLength: number): Buffer {
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(NUM_CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmLength, 40);
  return header;
}

/** Call the Gemini TTS generateContent endpoint and return the audio bytes + mime type. */
async function synthesize(
  key: string,
  model: string,
  voice: string,
  text: string,
): Promise<{ mimeType: string; data: Buffer }> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
    `:generateContent?key=${encodeURIComponent(key)}`;

  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
  }

  const json: any = await res.json();
  const candidates = json?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error(`Gemini API returned no candidates: ${JSON.stringify(json)}`);
  }
  const parts = candidates[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return {
        mimeType: part.inlineData.mimeType ?? "audio/L16",
        data: Buffer.from(part.inlineData.data, "base64"),
      };
    }
  }
  throw new Error(`Gemini API returned no audio: ${JSON.stringify(json)}`);
}

/** Convert audio bytes (given their mimeType) into a full WAV file buffer. */
function toWav(mimeType: string, audio: Buffer): Buffer {
  const mime = mimeType.toLowerCase();

  if (mime.includes("wav")) return audio;

  if (mime.includes("mp3") || mime.includes("mpeg")) {
    const mp3 = path.join(os.tmpdir(), `news_builder_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);
    const wav = path.join(os.tmpdir(), `news_builder_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);
    fss.writeFileSync(mp3, audio);
    try {
      convertMp3ToWav(mp3, wav);
      return fss.readFileSync(wav);
    } finally {
      fss.rmSync(mp3, { force: true });
      fss.rmSync(wav, { force: true });
    }
  }

  // Raw PCM L16 / SAMPLE_RATE / mono — wrap with a wav header.
  return Buffer.concat([wavHeader(audio.length), audio]);
}

/** Extract the PCM frames from a standard 44-byte-header wav buffer. */
function extractPcm(wav: Buffer): Buffer {
  // Standard RIFF/WAVE with 44-byte header → data starts at offset 44.
  return wav.subarray(44);
}

/** Convert an MP3 file to WAV using macOS `afconvert`. */
function convertMp3ToWav(mp3Path: string, wavPath: string): void {
  const r = spawnSync("afconvert", ["-f", "WAVE", "-d", "LEI16", mp3Path, wavPath], {
    encoding: "utf8",
    timeout: 300_000,
  });
  if (r.status !== 0) {
    throw new Error(`afconvert failed: ${r.stderr?.trim() || r.error?.message || "unknown"}`);
  }
}

/** Synthesize `text` with the given voice, retrying transient API errors and honoring RetryInfo delays. */
async function synthesizeWithRetry(
  key: string,
  model: string,
  voice: string,
  text: string,
): Promise<{ mimeType: string; data: Buffer }> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await synthesize(key, model, voice, text);
    } catch (err) {
      lastErr = err;
      const msg = (err as Error).message;
      // Respect the API-provided retry delay if present, else back off.
      const delayMatch = msg.match(/retryDelay.?[:\s]*"(\d+\.?\d*)s"/i);
      const retryDelay = delayMatch ? parseFloat(delayMatch[1]) * 1000 : attempt * 8000;
      console.log(`  attempt ${attempt} failed (${msg.split("\n")[0]}); retrying in ${Math.round(retryDelay / 1000)}s`);
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }
  throw new Error(`failed after 5 attempts: ${(lastErr as Error)?.message}`);
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const key = await loadApiKey();
  if (!key) {
    console.error("[news_builder] ERROR: GEMINI_API_KEY not found in .env or environment.");
    process.exit(1);
  }

  let scenario: string;
  try {
    scenario = await fsp.readFile(opts.input, "utf8");
  } catch (err) {
    console.error(`[news_builder] ERROR: cannot read input file: ${opts.input}\n  ${err}`);
    process.exit(1);
  }
  if (!scenario.trim()) {
    console.error(`[news_builder] ERROR: input file is empty: ${opts.input}`);
    process.exit(1);
  }

  const lines = parseScenario(scenario);
  const outPath = path.join(
    opts.outputDir,
    `${(await weekPrefix(opts.input)) ?? "full_news"}_full_news.wav`,
  );

  // ---- Single-call mode (quota-friendly): synthesize whole script in ONE request. ----
  if (opts.single) {
    const fullText = lines.map(([, t]) => t).join(" ");
    const voice = opts.voice || "puck";
    console.log(
      `[news_builder] SINGLE mode: ${lines.length} lines joined → ${fullText.length} chars, one call`,
    );
    console.log(`[news_builder] voice=${voice} (model=${opts.model})`);
    await fsp.mkdir(opts.outputDir, { recursive: true });
    const { mimeType, data } = await synthesizeWithRetry(key, opts.model, voice, fullText);
    const wav = toWav(mimeType, data);
    fss.writeFileSync(outPath, wav);
    const seconds = wav.subarray(44).length / (SAMPLE_RATE * 2);
    const bytes = fss.statSync(outPath).size;
    console.log(
      `[news_builder] OK ${outPath} (${bytes} bytes, ~${seconds.toFixed(1)}s, single call)`,
    );
    return;
  }

  console.log(
    `[news_builder] read ${scenario.length} chars, ${lines.length} speaker lines from ${opts.input}`,
  );
  console.log(
    `[news_builder] voices: host=${opts.hostVoice}, reporter=${opts.reporterVoice} (model=${opts.model})`,
  );

  await fsp.mkdir(opts.outputDir, { recursive: true });
  const prefix = (await weekPrefix(opts.input)) ?? "full_news";

  // Per-line clip cache so interrupted runs (e.g. daily quota limit) can resume.
  const clipsDir = path.join(opts.outputDir, `.clips_${prefix}`);
  await fsp.mkdir(clipsDir, { recursive: true });
  const clipPath = (i: number, voice: string) => path.join(clipsDir, `clip_${String(i).padStart(3, "0")}_${voice}.wav`);

  // Synthesize speaker-by-speaker, keep the original interleaved order.
  const pcmParts: Buffer[] = [];
  for (let i = 0; i < lines.length; i++) {
    const [speaker, text] = lines[i];
    const voice = speaker === "호스트" ? opts.hostVoice : opts.reporterVoice;
    const tag = `[${i + 1}/${lines.length}] ${speaker}`;
    const cached = clipPath(i, voice);
    try {
      if (fss.existsSync(cached) && fss.statSync(cached).size > 44) {
        pcmParts.push(extractPcm(fss.readFileSync(cached)));
        console.log(`${tag} ≤ ${voice} (cached, ${bufferSeconds(pcmParts[pcmParts.length - 1]).toFixed(1)}s)`);
        continue;
      }
      console.log(`${tag} → ${voice} ...`);
      const { mimeType, data } = await synthesizeWithRetry(key, opts.model, voice, text);
      const wav = toWav(mimeType, data);
      fss.writeFileSync(cached, wav);
      pcmParts.push(extractPcm(wav));
      console.log(`  ✓ ${bufferSeconds(pcmParts[pcmParts.length - 1]).toFixed(1)}s (${mimeType})`);
    } catch (err) {
      console.error(`  ✗ ${(err as Error).message}`);
      console.error(
        `[news_builder] paused at segment ${i + 1}. Re-run the command to resume; completed clips are cached in ${clipsDir}`,
      );
      process.exit(1);
    }
  }

  // Concatenate all PCM frames and write a single wav file.
  const fullPcm = Buffer.concat(pcmParts);
  fss.writeFileSync(outPath, Buffer.concat([wavHeader(fullPcm.length), fullPcm]));

  const seconds = fullPcm.length / (SAMPLE_RATE * 2);
  const bytes = fss.statSync(outPath).size;
  console.log(
    `[news_builder] OK ${outPath} (${bytes} bytes, ~${seconds.toFixed(1)}s, ${lines.length} segments)`,
  );
}

/** Seconds represented by a PCM buffer (mono 16-bit @ SAMPLE_RATE). */
function bufferSeconds(pcm: Buffer): number {
  return pcm.length / (SAMPLE_RATE * 2);
}

main().catch((err) => {
  console.error("[news_builder] FATAL:", err);
  process.exit(1);
});