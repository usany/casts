#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""easyocr_helper.py — OCR helper invoked by scripts/khu_crawler.ts

Reads text from notice images using easyocr (ko + en).
Usage:
    python3 easyocr_helper.py <image_path> [image_path ...]

Prints a single JSON document to stdout:
    { "result": [ { "file": "<basename>", "text": "...", "count": N }, ... ] }

easyocr model weights are cached on first run (~/.EasyOCR) so the first call is slow.
"""
import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")

def main() -> None:
    paths = [p for p in sys.argv[1:] if os.path.exists(p)]
    if not paths:
        print(json.dumps({"result": []}, ensure_ascii=False))
        return

    import easyocr

    # ko + en; CPU only to avoid GPU dependency issues on mac homebrew builds.
    reader = easyocr.Reader(["ko", "en"], gpu=False, verbose=False)

    result: list = []
    for p in paths:
        try:
            # paragraph=True groups fragment lines; detail=0 returns plain text lines.
            lines = reader.readtext(p, detail=0, paragraph=True)
            text = "\n".join(str(x) for x in lines if str(x).strip())
        except Exception as exc:  # per-file errors must not kill the whole batch
            text = f"[OCR error: {exc}]"
        result.append(
            {
                "file": os.path.basename(p),
                "text": text,
                "count": len([l for l in text.splitlines() if l.strip()]),
            }
        )

    print(json.dumps({"result": result}, ensure_ascii=False))

if __name__ == "__main__":
    main()
