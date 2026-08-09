import os, re, subprocess, sys

BASE = os.path.dirname(__file__)
SCENARIO = os.path.join(BASE, "03_news_scenario.md")
OUT = os.path.join(BASE, "04_news_files")
os.makedirs(OUT, exist_ok=True)

VOICES = {"호스트": "Yuna", "리포터": "Yuna"}


def parse_scenario(path):
    lines = []
    with open(path) as f:
        for raw in f:
            line = raw.strip()
            m = re.match(r"^\*\*(호스트|리포터):\*\*\s*(.*)$", line)
            if m and m.group(2).strip():
                lines.append((m.group(1), m.group(2).strip()))
    return lines


lines = parse_scenario(SCENARIO)
print(f"Total speaker lines: {len(lines)}")

ok = 0
for i, (speaker, text) in enumerate(lines, 1):
    voice = VOICES[speaker]
    fname = f"clip_{i:03d}_{speaker}.wav"
    aiff = os.path.join(OUT, f"tmp_{i:03d}.aiff")
    wav = os.path.join(OUT, fname)
    if os.path.exists(wav) and os.path.getsize(wav) > 0:
        ok += 1
        print(f"[{i}] exists {fname}", flush=True)
        continue
    try:
        r = subprocess.run(
            ["say", "-v", voice, "-o", aiff, text],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if r.returncode != 0:
            print(f"[{i}] say failed: {r.stderr.strip()}", flush=True)
            continue
        r2 = subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16", aiff, wav],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if r2.returncode != 0:
            print(f"[{i}] afconvert failed: {r2.stderr.strip()}", flush=True)
            continue
        os.remove(aiff)
        ok += 1
        print(f"[{i}] {speaker} -> {fname} ({os.path.getsize(wav)} bytes)", flush=True)
    except Exception as e:
        print(f"[{i}] error: {e}", flush=True)

print(f"DONE {ok}/{len(lines)} clips")
