import os, re, json, base64, urllib.request, urllib.error, sys, time

KEY = None
with open(os.path.join(os.path.dirname(__file__), "..", ".env")) as f:
    for line in f:
        line = line.strip()
        if line.startswith("GEMINI_API_KEY"):
            KEY = line.split("=", 1)[1].strip().strip('"').strip("'")

if not KEY:
    print("GEMINI_API_KEY not found in .env")
    sys.exit(1)

MODEL = "gemini-2.5-flash-preview-tts"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"

VOICES = {
    "호스트": "KoreaLite",
    "리포터": "KoreaLive",
}

OUT_DIR = os.path.join(os.path.dirname(__file__), "04_news_files")
os.makedirs(OUT_DIR, exist_ok=True)


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
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.loads(r.read().decode("utf-8"))
    candidates = resp.get("candidates", [])
    if not candidates:
        raise RuntimeError(f"no candidates: {resp}")
    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            return base64.b64decode(part["inlineData"]["data"])
    raise RuntimeError(f"no audio in response: {resp}")


def parse_scenario(path):
    lines = []
    with open(path) as f:
        for raw in f:
            line = raw.strip()
            m = re.match(r"^\*\*(호스트|리포터):\*\*\s*(.*)$", line)
            if m and m.group(2).strip():
                lines.append((m.group(1), m.group(2).strip()))
    return lines


def main():
    scenario = os.path.join(os.path.dirname(__file__), "03_news_scenario.md")
    lines = parse_scenario(scenario)
    print(f"Total speaker lines: {len(lines)}")
    idx = 0
    for i, (speaker, text) in enumerate(lines, 1):
        voice = VOICES.get(speaker, "KoreaLite")
        fname = f"clip_{i:03d}_{speaker}.wav"
        path = os.path.join(OUT_DIR, fname)
        for attempt in range(3):
            try:
                audio = synthesize(text, voice)
                with open(path, "wb") as f:
                    f.write(audio)
                idx += 1
                print(f"[{i}] {speaker} -> {fname} ({len(audio)} bytes)", flush=True)
                break
            except Exception as e:
                print(f"[{i}] attempt {attempt + 1} failed: {e}", flush=True)
                time.sleep(3)
        else:
            print(f"[{i}] FAILED: {speaker} {text[:40]}", flush=True)
    print(f"DONE {idx}/{len(lines)} clips")


if __name__ == "__main__":
    main()
