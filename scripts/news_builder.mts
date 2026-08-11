/**
 * news_builder.mts — replaces the `news-builder` agent using the Gemini TTS API.
 *
 * Mirrors `.claude/agents/news-builder.md` + `_workspace/tts_gemini_full.py`:
 *   1. Reads the scenario file `_workspace/03_news_scenario.md`
 *   2. Parses the host(호스트)/reporter(리포터) speaker lines
 *   3. Calls the Gemini TTS model (`gemini-2.5-flash-preview-tts`, voice `puck`)
 *      with the full script text in a single request
 *   4. Writes the resulting audio to `_workspace/04_news_files/{week}_full_news.wav`
 *
 * The news-builder agent only needs a single speech file, so we synthesize the
 * whole scenario in one call (saves Gemini TTS quota vs. per-line calls).
 *
 * API key: read from `GEMINI_API_KEY` in `.env` (or `GEMINI_API_KEY` env var).
 *
 * Run (from repo root):
 *   npx tsx scripts/news_builder.mts
 *   npx tsx scripts/news_builder.mts --input=_workspace/03_news_scenario.md
 *   npx tsx scripts/news_builder.mts --output=_workspace/04_news_files
 *   npx tsx scripts/news_builder.mts --model=gemini-2.5-flash-preview-tts --voice=puck
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
const DEFAULT_VOICE = "puck";

const WEEK_ORDINALS: Record<string, string> = {
  첫째: "w1", 둘째: "w2", 셋째: "w3", 넷째: "w4", 다섯째: "w5", 여섯째: "w6",
};

interface Options {
  input: string;
  outputDir: string;
  model: string;
  voice: string;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    input: DEFAULT_INPUT,
    outputDir: DEFAULT_OUTPUT_DIR,
    model: process.env.GEMINI_TTS_MODEL ?? DEFAULT_MODEL,
    voice: process.env.GEMINI_TTS_VOICE ?? DEFAULT_VOICE,
  };
  for (const a of argv) {
    if (a.startsWith("--input=")) opts.input = a.slice("--input=".length);
    else if (a.startsWith("--output=")) opts.outputDir = a.slice("--output=".length);
    else if (a.startsWith("--model=")) opts.model = a.slice("--model=".length);
    else if (a.startsWith("--voice=")) opts.voice = a.slice("--voice=".length);
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

/** Call the Gemini TTS generateContent endpoint and return the raw audio bytes. */
async function synthesize(
  key: string,
  model: string,
  voice: string,
  text: string,
): Promise<Buffer> {
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
      return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error(`Gemini API returned no audio: ${JSON.stringify(json)}`);
}

/** Write raw PCM L16/24000Hz bytes as a mono 16-bit WAV file. */
function writePcmAsWav(pcm: Buffer, outPath: string): void {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  fss.writeFileSync(outPath, Buffer.concat([header, pcm]));
}

/** Convert an MP3 file to WAV using macOS `afconvert` (fallback for MP3 mime). */
function convertMp3ToWav(mp3Path: string, wavPath: string): void {
  const r = spawnSync("afconvert", ["-f", "WAVE", "-d", "LEI16", mp3Path, wavPath], {
    encoding: "utf8",
    timeout: 300_000,
  });
  if (r.status !== 0) {
    throw new Error(`afconvert failed: ${r.stderr?.trim() || r.error?.message || "unknown"}`);
  }
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
  const fullText = lines.map(([, t]) => t).join(" ");
  console.log(
    `[news_builder] read ${scenario.length} chars, ${lines.length} speaker lines, ` +
      `${fullText.length} speech chars from ${opts.input}`,
  );

  await fsp.mkdir(opts.outputDir, { recursive: true });
  const prefix = (await weekPrefix(opts.input)) ?? "full_news";
  const outPath = path.join(opts.outputDir, `${prefix}_full_news.wav`);

  console.log(
    `[news_builder] synthesizing ${opts.model} (voice=${opts.voice}) in a single call...`,
  );

  // Retry a few times on transient API errors.
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const audio = await synthesize(key, opts.model, opts.voice, fullText);
      // Gemini TTS returns raw PCM L16/24000Hz; headers vary. Detect by magic.
      const isWav = audio.length > 12 && audio.subarray(0, 4).toString("latin1") === "RIFF";
      const isMp3 = audio.length > 2 && audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;

      if (isWav) {
        await fsp.writeFile(outPath, audio);
      } else if (isMp3) {
        const tmp = path.join(os.tmpdir(), `news_builder_${Date.now()}.mp3`);
        await fsp.writeFile(tmp, audio);
        try {
          convertMp3ToWav(tmp, outPath);
        } finally {
          await fsp.rm(tmp, { force: true });
        }
      } else {
        // Assume raw PCM L16/24000Hz mono.
        writePcmAsWav(audio, outPath);
      }

      const bytes = (await fsp.stat(outPath)).size;
      console.log(`[news_builder] OK ${outPath} (${bytes} bytes)`);
      return;
    } catch (err) {
      lastErr = err;
      console.log(`[news_builder] attempt ${attempt} failed: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.error(`[news_builder] FAILED after 3 attempts: ${(lastErr as Error)?.message}`);
  process.exit(1);
}

main().catch((err) => {
  console.error("[news_builder] FATAL:", err);
  process.exit(1);
});