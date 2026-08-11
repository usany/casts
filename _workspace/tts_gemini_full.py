import os
import re
import sys
import json
import base64
import urllib.request
import time

BASE = os.path.dirname(__file__)
SCENARIO = os.path.join(BASE, "03_news_scenario.md")
OUT = os.path.join(BASE, "04_news_files")
os.makedirs(OUT, exist_ok=True)

KEY = None
with open(os.path.join(BASE, "..", ".env")) as f:
    for line in f:
        line = line.strip()
        if line.startswith("GEMINI_API_KEY"):
            KEY = line.split("=", 1)[1].strip().strip('"').strip("'")

if not KEY:
    print("GEMINI_API_KEY not found in .env")
    sys.exit(1)

MODEL = "gemini-2.5-flash-preview-tts"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
VOICE = "puck"


def week_prefix(scenario_path):
    with open(scenario_path) as f:
        first = f.readline()
    ordinals = {"첫째": "w1", "둘째": "w2", "셋째": "w3", "넷째": "w4", "다섯째": "w5", "여섯째": "w6"}
    m = re.search(r"(\d{4})년\s*(\d{1,2})월\s*([가-힣]+) 주", first)
    if m:
        return f"{m.group(1)}_{int(m.group(2)):02d}_{ordinals.get(m.group(3), 'w1')}"
    return None


def parse_scenario(path):
    lines = []
    with open(path) as f:
        for raw in f:
            line = raw.strip()
            m = re.match(r"^\*\*(호스트|리포터):\*\*\s*(.*)$", line)
            if m and m.group(2).strip():
                lines.append((m.group(1), m.group(2).strip()))
    return lines


def synthesize(text, voice):
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}
            },
        },
    }
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=600) as r:
        resp = json.loads(r.read().decode("utf-8"))
    candidates = resp.get("candidates", [])
    if not candidates:
        raise RuntimeError(f"no candidates: {resp}")
    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            return part["inlineData"].get("mimeType", "audio/wav"), base64.b64decode(part["inlineData"]["data"])
    raise RuntimeError(f"no audio in response: {resp}")


def main():
    lines = parse_scenario(SCENARIO)
    full_text = " ".join(t for _, t in lines)
    print(f"Speaker lines: {len(lines)} | total chars: {len(full_text)}", flush=True)

    prefix = week_prefix(SCENARIO) or "full_news"
    fname = f"{prefix}_full_news.wav"
    path = os.path.join(OUT, fname)

    for attempt in range(3):
        try:
            mime, audio = synthesize(full_text, VOICE)
            if "mp3" in mime or "mpeg" in mime:
                ext = ".mp3"
                tmp = os.path.join(OUT, f"tmp_full{ext}")
                with open(tmp, "wb") as f:
                    f.write(audio)
                import subprocess
                r = subprocess.run(
                    ["afconvert", "-f", "WAVE", "-d", "LEI16", tmp, path],
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                if r.returncode != 0:
                    raise RuntimeError(f"afconvert failed: {r.stderr.strip()}")
                os.remove(tmp)
            elif "L16" in mime or "pcm" in mime:
                import wave
                with wave.open(path, "wb") as w:
                    w.setparams((1, 2, 24000, 24000, "NONE", "not compressed"))
                    w.writeframes(audio)
            elif "wav" in mime:
                with open(path, "wb") as f:
                    f.write(audio)
            else:
                raise RuntimeError(f"unexpected mime: {mime}")
            print(f"OK {fname} ({os.path.getsize(path)} bytes, {mime})", flush=True)
            return
        except Exception as e:
            print(f"attempt {attempt + 1} failed: {e}", flush=True)
            time.sleep(5)
    print("FAILED", flush=True)
    sys.exit(1)


if __name__ == "__main__":
    main()
