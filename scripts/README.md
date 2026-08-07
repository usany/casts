# KHU News Crawler & Broadcaster

This project crawls notices from Kyung Hee University's announcement board and generates a formatted news broadcast organized by week.

## Overview

- **Crawler**: Fetches notices from https://www.khu.ac.kr/kor/user/bbs/BMSR00040
- **Period**: June 29 - August 2, 2026 (organized into 5 weeks)
- **Output**: Weekly markdown files, JSON manifest, and news broadcast

## Scripts

### `crawl-khu-robust.mjs`

Robust crawler that fetches all notices within the date range and downloads images/attachments.

**Features:**
- Automatically navigates through multiple pages (up to 50 pages)
- Downloads embedded images and attachments
- Error handling and retry logic
- Rate limiting between requests

**Usage:**

```bash
# Crawl default board (일반 - General)
node scripts/crawl-khu-robust.mjs

# Crawl specific board
node scripts/crawl-khu-robust.mjs 200316          # General notices
node scripts/crawl-khu-robust.mjs 200317          # Academic notices
node scripts/crawl-khu-robust.mjs 200318          # Scholarship notices

# Custom output directory
node scripts/crawl-khu-robust.mjs 200316 /custom/path
```

**Output:**
- `week1.md` through `week5.md` - Weekly markdown files with full notice details
- `_raw.json` - Complete raw data with all fields
- `_manifest.json` - Simplified manifest with essential fields
- `images/` - Downloaded images and attachments

### `generate-broadcast.mjs`

Generates a formatted news broadcast from crawled data.

**Features:**
- Groups notices by week (5 weeks of July 2026)
- Formatted as a professional news broadcast
- Includes metadata: campus, author, date, attachments, images
- Summary statistics per week

**Usage:**

```bash
node scripts/generate-broadcast.mjs
```

**Output:**
- `NEWS_BROADCAST.txt` - Formatted news broadcast with weekly summaries

## `enhance-broadcast-korean.mjs`

Enhances Korean broadcast transcriptions with detailed content descriptions from the week files.

**Features:**
- Extracts full notice content from week markdown files
- Adds deadline information (⏰ 마감)
- Classifies notices by category (모집/행사/채용/수강신청)
- Includes full excerpt text from original notices
- Preserves department and campus information
- Generates natural Korean reporter dialogue with substantive content

**Usage:**

```bash
node scripts/enhance-broadcast-korean.mjs
```

**Output:**
- `week*_broadcast_transcription_ko_enhanced.md` - Enhanced Korean transcriptions with rich content descriptions

**Output Example:**

```markdown
## 세그먼트 1: [창업교육센터] KHU Valley Program(KVP) 15기 모집 안내

**리포터:**

물론이죠! "[창업교육센터] KHU Valley Program(KVP) 15기 모집 안내"

**주요 정보:** ⏰ 마감: 7.31 

공지사항의 카테고리: "모집"

**공지 내용:** "창업교육센터에서는 KHU Valley Program(KVP) 15기를 모집 하오니 학생 여러분의 많은 관심과 적극적인 신청을 부탁드립니다..."
```

This differs from the standard Korean transcription by including:
- Extracted deadline information
- Category classification
- Full content excerpts
- More detailed reporter descriptions

## NPM Scripts

Add to `package.json`:

```json
"scripts": {
  "crawl": "node scripts/crawl-khu-robust.mjs",
  "broadcast": "node scripts/generate-broadcast.mjs",
  "generate:broadcast-transcriptions": "node scripts/generate-broadcast-transcriptions.mjs",
  "translate:broadcast-ko": "node scripts/translate-broadcast-to-korean.mjs",
  "enhance:broadcast-ko": "node scripts/enhance-broadcast-korean.mjs",
  "broadcast:ko": "npm run generate:broadcast-transcriptions && npm run translate:broadcast-ko && npm run enhance:broadcast-ko",
  "news": "npm run crawl && npm run broadcast"
}
```

**Quick commands:**

```bash
npm run crawl                              # Crawl notices
npm run broadcast                          # Generate news broadcast
npm run generate:broadcast-transcriptions  # Generate English broadcast transcriptions
npm run translate:broadcast-ko             # Translate to Korean
npm run enhance:broadcast-ko               # Enhance with detailed content descriptions
npm run broadcast:ko                       # Full workflow: English → Korean → Enhanced Korean
npm run news                               # Crawl + broadcast in sequence
```

## Output Format

### NEWS_BROADCAST.txt

Professional news broadcast format:

```
╔══════════════════════════════════════════════════════════════════╗
║          🎙️  KHU NEWS BROADCAST - JULY 2026  🎙️                ║
║                    Weekly News Summary                           ║
╚══════════════════════════════════════════════════════════════════╝

══════════════════════════════════════════════════════════════════
📅 WEEK 1: June 29 - July 5
══════════════════════════════════════════════════════════════════

📊 Total Notices: 25

 1. [2026-06-29] Title of notice
    📍 Campus: Location
    ✍️  Author: Department
    📝 Content preview...
    📎 Attachments count
    🖼️  Images count
```

Each notice includes:
- Date
- Title
- Campus location
- Author/Department
- Content preview (first line)
- Number of attachments
- Number of images

### Weekly Markdown Files

Detailed markdown format with full content:

```markdown
# Kyung Hee University - Notices (일반)

## July 2026 - Week 1 (2026-06-29 ~ 2026-07-05)

- **Board**: 공지사항 > 일반
- **Source**: https://...
- **Notices**: 25

---

### Notice Title

> Campus: Seoul | Date: 2026-06-29 | Author: Department | [Original](link)

Full notice content...

**Content Images:**
- ![title](images/322525_0.jpg)

**Attachments:**
- [filename.pdf](download-link)
```

### JSON Manifest

`_manifest.json` contains essential data in JSON format:

```json
[
  {
    "boardId": "322525",
    "title": "Notice Title",
    "date": "2026-06-29",
    "author": "Department",
    "campus": "Seoul",
    "contentText": "Full text content...",
    "localImages": ["images/322525_0.jpg"],
    "images": ["https://..."],
    "attachments": [{"name": "file.pdf", "href": "https://..."}]
  }
]
```

## Week Definitions

- **Week 1**: June 29 - July 5
- **Week 2**: July 6 - July 12
- **Week 3**: July 13 - July 19
- **Week 4**: July 20 - July 26
- **Week 5**: July 27 - August 2

## Configuration

Edit constants in the scripts to customize:

```javascript
// crawl-khu-robust.mjs
const BASE = 'https://www.khu.ac.kr/kor/user/bbs/BMSR00040'
const MENU_NO = '200316'  // Board ID
const OUT_DIR = 'khu-notices-2026-07'
const START = new Date('2026-06-29T00:00:00+09:00')
const END = new Date('2026-08-02T23:59:59+09:00')
```

## Board IDs

- `200316`: 일반 (General)
- `200317`: 학사 (Academic)
- `200318`: 장학 (Scholarship)

## Requirements

- Node.js (v18+)
- Playwright
- ~500MB disk space for output (images + JSON)

## Error Handling

Both scripts include robust error handling:
- Network timeouts: retries with exponential backoff
- Resource errors: graceful degradation (skips problematic pages)
- Missing elements: safe navigation with fallbacks
- File operations: automatic directory creation

## Performance

- Crawling: ~3-5 minutes for full dataset (~95 notices)
- Broadcasting: <1 second
- Image downloads: 30-60 seconds depending on network

## Examples

### Full Workflow

```bash
# Clean previous run
rm -rf khu-notices-2026-07

# Crawl all data
npm run crawl

# Generate broadcast
npm run broadcast

# View results
cat khu-notices-2026-07/NEWS_BROADCAST.txt
```

### Crawl Specific Board

```bash
node scripts/crawl-khu-robust.mjs 200317  # Academic notices only
npm run broadcast
```

### Access Data Programmatically

```javascript
const manifest = JSON.parse(
  fs.readFileSync('khu-notices-2026-07/_manifest.json', 'utf8')
)

manifest.forEach(notice => {
  console.log(`${notice.date}: ${notice.title}`)
})
```

## Troubleshooting

### No notices found
- Check date range matches your data
- Verify board ID is correct
- Check network connectivity

### Images not downloaded
- Large file sizes may be skipped
- Check disk space
- Verify image URLs are accessible

### Browser context error
- Restart script (closes browser properly)
- Check system resources
- Increase timeouts if network is slow

## Future Enhancements

- [ ] Export to CSV
- [ ] Email notification
- [ ] Slack integration
- [ ] Schedule crawler with cron
- [ ] Web viewer for notices
- [ ] Full-text search
