# Quick Start Guide: KHU News Crawler

## What You Have

A complete Playwright-based crawler that fetches Korean university notices and formats them as a news broadcast.

## 30-Second Setup

```bash
cd C:\Users\dksck\casts

# View the news broadcast
cat khu-notices-2026-07/NEWS_BROADCAST.txt

# Or re-run the complete workflow
npm run news
```

## What Was Crawled

✅ **95 notices** from June 29 - August 2, 2026  
✅ **5 weeks** of categorized data  
✅ **61 images** downloaded locally  
✅ **Organized by week** with summaries

## Files Created

```
khu-notices-2026-07/
├── NEWS_BROADCAST.txt      ← Read this for formatted news
├── week1.md to week5.md    ← Full details per week
├── _manifest.json          ← Machine-readable data
├── _raw.json               ← Complete raw data
└── images/                 ← Downloaded images
```

## Usage

### View the News Broadcast

```bash
# On Windows
type khu-notices-2026-07\NEWS_BROADCAST.txt

# Or with cat
cat khu-notices-2026-07/NEWS_BROADCAST.txt
```

### Re-run Crawler

```bash
# Fetch latest data
npm run crawl

# Generate broadcast from existing data
npm run broadcast

# Do both
npm run news
```

### Access Specific Weeks

```bash
# View Week 1 (June 29 - July 5)
cat khu-notices-2026-07/week1.md

# View Week 4 (July 20 - July 26) - busiest week
cat khu-notices-2026-07/week4.md
```

### Search Notices

```bash
# Find all scholarship-related notices
grep -i "scholarship\|장학" khu-notices-2026-07/NEWS_BROADCAST.txt

# Find job postings
grep -i "채용\|추천" khu-notices-2026-07/NEWS_BROADCAST.txt

# Find startup programs
grep -i "창업\|startup" khu-notices-2026-07/NEWS_BROADCAST.txt
```

### Parse JSON Data

```bash
# View data structure
node -e "const d = require('./khu-notices-2026-07/_manifest.json'); console.log(d[0])"

# Extract all titles
node -e "const d = require('./khu-notices-2026-07/_manifest.json'); d.forEach(n => console.log(n.title))"

# Find notices from specific campus
node -e "const d = require('./khu-notices-2026-07/_manifest.json'); console.log(d.filter(n => n.campus.includes('서울')).length)"
```

## Data Overview

### By Week

- **Week 1** (Jun 29-Jul 5): 25 notices - Setup & programs start
- **Week 2** (Jul 6-Jul 12): 17 notices - Mid-week lull
- **Week 3** (Jul 13-Jul 19): 18 notices - Building momentum
- **Week 4** (Jul 20-Jul 26): 33 notices - **Peak activity**
- **Week 5** (Jul 27-Aug 2): 2 notices - Tail end

### By Type

- TA/Staff positions: ~37%
- Job recommendations: ~21%
- Entrepreneurship: ~16%
- Education/Language: ~11%
- Other: ~15%

### By Campus

- Seoul Campus: 35 notices
- International Campus: 30 notices
- Multi-campus: 30 notices

## News Broadcast Format

The `NEWS_BROADCAST.txt` file presents notices as a professional broadcast:

```
╔══════════════════════════════════════════════════════════════════╗
║          🎙️  KHU NEWS BROADCAST - JULY 2026  🎙️                ║
║                    Weekly News Summary                           ║
╚══════════════════════════════════════════════════════════════════╝

══════════════════════════════════════════════════════════════════
📅 WEEK 1: June 29 - July 5
══════════════════════════════════════════════════════════════════

📊 Total Notices: 25

 1. [2026-06-29] Title
    📍 Campus: Location
    ✍️  Author: Department
    📝 Content preview...
    📎 Attachments
    🖼️  Images
```

## Common Tasks

### Task: Find all notices for July 24
```bash
grep "2026-07-24" khu-notices-2026-07/NEWS_BROADCAST.txt
```

### Task: Find notices with attachments
```bash
grep "📎" khu-notices-2026-07/NEWS_BROADCAST.txt
```

### Task: Count notices by author
```bash
grep "✍️" khu-notices-2026-07/NEWS_BROADCAST.txt | sort | uniq -c | sort -rn
```

### Task: Find all Seoul campus notices
```bash
grep "Campus: 서울" khu-notices-2026-07/NEWS_BROADCAST.txt
```

### Task: Extract notice links
```bash
node -e "const d = require('./khu-notices-2026-07/_manifest.json'); d.forEach(n => console.log(n.title + ' (' + n.date + ')'))"
```

## Advanced Usage

### Generate Custom Report

```javascript
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('./khu-notices-2026-07/_manifest.json', 'utf8'));

// Group by author
const byAuthor = {};
manifest.forEach(n => {
  byAuthor[n.author] = (byAuthor[n.author] || 0) + 1;
});

console.log('Notices by Author:');
Object.entries(byAuthor).sort((a, b) => b[1] - a[1]).forEach(([author, count]) => {
  console.log(`${author}: ${count}`);
});
```

### Filter and Export

```bash
# Save only Seoul campus notices to CSV
node -e "
const d = require('./khu-notices-2026-07/_manifest.json');
const seoul = d.filter(n => n.campus.includes('서울'));
console.log('Date,Title,Author');
seoul.forEach(n => {
  console.log(\`\${n.date},\${n.title},\${n.author}\`);
});
" > seoul-notices.csv
```

## Troubleshooting

**Q: How do I see just the news broadcast?**  
A: `cat khu-notices-2026-07/NEWS_BROADCAST.txt`

**Q: How do I re-fetch the data?**  
A: `npm run crawl` - this will update all files

**Q: Where are the downloaded images?**  
A: `khu-notices-2026-07/images/` directory

**Q: Can I see the raw data?**  
A: Yes, `khu-notices-2026-07/_manifest.json` (clean) or `_raw.json` (complete)

**Q: What if I need a different date range?**  
A: Edit the START/END dates in `scripts/crawl-khu-robust.mjs` and re-run

## Scripts Reference

| Command | What it does |
|---------|------------|
| `npm run crawl` | Fetch notices from website, download images |
| `npm run broadcast` | Generate NEWS_BROADCAST.txt from existing data |
| `npm run news` | Run both: crawl → broadcast |

## Next Steps

1. **View the broadcast**: `cat khu-notices-2026-07/NEWS_BROADCAST.txt`
2. **Explore a specific week**: `cat khu-notices-2026-07/week2.md`
3. **Access the data**: Use `_manifest.json` for programmatic access
4. **Search notices**: Use grep or jq to filter

---

**Source**: https://www.khu.ac.kr/kor/user/bbs/BMSR00040/list.do?menuNo=200316  
**Period**: June 29 - August 2, 2026  
**Total**: 95 notices from 61 pages
