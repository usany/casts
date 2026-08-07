# KHU News Broadcast Transcriptions

This directory contains news broadcast transcriptions generated from the weekly markdown notice files.

## Generated Files

| File | Week | Date Range | Notices | File Size |
|------|------|-----------|---------|-----------|
| `week1_broadcast_transcription.md` | 1 | 2026-06-29 ~ 2026-07-05 | 25 | 16 KB |
| `week2_broadcast_transcription.md` | 2 | 2026-07-06 ~ 2026-07-12 | 17 | 11 KB |
| `week3_broadcast_transcription.md` | 3 | 2026-07-13 ~ 2026-07-19 | 18 | 12 KB |
| `week4_broadcast_transcription.md` | 4 | 2026-07-20 ~ 2026-07-26 | 33 | 20 KB |
| `week5_broadcast_transcription.md` | 5 | 2026-07-27 ~ 2026-08-02 | 2 | 2 KB |

**Total:** 95 notices across 5 weeks

## File Format

Each transcription file contains:

- **Header**: KHU News Broadcast branding with broadcast date and notice count
- **Opening Segment**: Anchor introduction setting the context
- **News Segments**: For each notice:
  - Segment number and title
  - Anchor lead-in with date, department, and campus
  - Reporter provides notice title and excerpt
  - Additional metadata (attachments, images)
  - Anchor acknowledgment
  - Separator between segments
- **Closing Segment**: Anchor wrap-up and sign-off

### Format Example

```
SEGMENT 1: [DEPARTMENT] Notice Title

ANCHOR:
Next up, we have an important announcement dated 2026-06-29.
This comes from DEPARTMENT NAME at our CAMPUS campus.
Reporter 1, could you brief us on this?

REPORTER 1:
Of course! "[DEPARTMENT] Notice Title"

The notice states: "Notice excerpt..."

Additional materials: 📎 X files • 🖼️ Y images

ANCHOR:
Thank you for that update.
```

## Features

- ✅ Anchor and reporter dialogue structure
- ✅ Chronologically organized by week
- ✅ Department/Campus information extracted
- ✅ Notice excerpts for context
- ✅ Attachment and image counts
- ✅ Featured notices marked with ⭐
- ✅ Professional broadcast-style formatting

## Generation Script

The transcriptions were generated using `../scripts/generate-broadcast-transcriptions.mjs`

To regenerate or modify transcriptions, run:

```bash
npm run generate:broadcast-transcriptions
# or
node scripts/generate-broadcast-transcriptions.mjs
```

## Usage

These files can be:
- Read aloud for audio broadcast simulation
- Used for training news anchors and reporters
- Converted to audio/video with text-to-speech tools
- Analyzed for communication patterns
- Formatted for publication on websites or apps
