import asyncio
import os
import re
import subprocess
import wave

import edge_tts

BASE = os.path.dirname(__file__)
SCENARIO = os.path.join(BASE, "03_news_scenario.md")
OUT = os.path.join(BASE, "04_news_files")
os.makedirs(OUT, exist_ok=True)

WEEK_ORDINALS = {"첫째": "w1", "둘째": "w2", "셋째": "w3", "넷째": "w4", "다섯째": "w5", "여섯째": "w6"}


def week_prefix(scenario_path):
    with open(scenario_path) as f:
        first = f.readline()
    m = re.search(r"(\d{4})년\s*(\d{1,2})월\s*([가-힣]+) 주", first)
    if m:
        return f"{m.group(1)}_{int(m.group(2)):02d}_{WEEK_ORDINALS.get(m.group(3), 'w1')}"
    return None

VOICES = {"호스트": "ko-KR-SunHiNeural", "리포터": "ko-KR-InJoonNeural"}

WAVE_PARAMS = (1, 2, 24000, 24000, "NONE", "not compressed")


def parse_scenario(path):
    lines = []
    with open(path) as f:
        for raw in f:
            line = raw.strip()
            m = re.match(r"^\*\*(호스트|리포터):\*\*\s*(.*)$", line)
            if m and m.group(2).strip():
                lines.append((m.group(1), m.group(2).strip()))
    return lines


def read_wav(path):
    with wave.open(path, "rb") as w:
        assert w.getsampwidth() == 2 and w.getnchannels() == 1
        return w.readframes(w.getnframes())


def concat_wav(paths, out_path):
    frames = b"".join(read_wav(p) for p in paths)
    with wave.open(out_path, "wb") as w:
        w.setparams(WAVE_PARAMS)
        w.writeframes(frames)


async def synth(line, i):
    speaker, text = line
    voice = VOICES[speaker]
    fname = f"clip_{i:03d}_{speaker}.wav"
    wav = os.path.join(OUT, fname)
    if os.path.exists(wav) and os.path.getsize(wav) > 0:
        print(f"[{i}] exists {fname}", flush=True)
        return True
    mp3 = os.path.join(OUT, f"tmp_{i:03d}.mp3")
    try:
        await edge_tts.Communicate(text, voice).save(mp3)
        r = subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16", mp3, wav],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if r.returncode != 0:
            print(f"[{i}] afconvert failed: {r.stderr.strip()}", flush=True)
            return False
        os.remove(mp3)
        print(f"[{i}] {speaker} -> {fname} ({os.path.getsize(wav)} bytes)", flush=True)
        return True
    except Exception as e:
        print(f"[{i}] error: {e}", flush=True)
        return False


async def main():
    lines = parse_scenario(SCENARIO)
    print(f"Total speaker lines: {len(lines)}")
    results = await asyncio.gather(*(synth(line, i) for i, line in enumerate(lines, 1)))
    ok = sum(1 for r in results if r)
    print(f"DONE {ok}/{len(lines)} clips")

    if ok == len(lines):
        paths = [os.path.join(OUT, f"clip_{i:03d}_{speaker}.wav") for i, (speaker, _) in enumerate(lines, 1)]
        prefix = week_prefix(SCENARIO)
        full_name = f"{prefix}_full_news.wav" if prefix else "full_news.wav"
        full = os.path.join(OUT, full_name)
        concat_wav(paths, full)
        print(f"{full_name} written: {os.path.getsize(full)} bytes")


if __name__ == "__main__":
    asyncio.run(main())
