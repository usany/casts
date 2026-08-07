# KHU News Crawler - Usage Examples

## 🎯 Quick Start (30 seconds)

```bash
cd C:\Users\dksck\casts
cat khu-notices-2026-07/NEWS_BROADCAST.txt
```

That's it! You now have a professional news broadcast of all KHU notices for July 2026.

---

## 📰 What You'll See

```
╔══════════════════════════════════════════════════════════════════╗
║          🎙️  KHU NEWS BROADCAST - JULY 2026  🎙️                ║
║                    Weekly News Summary                           ║
╚══════════════════════════════════════════════════════════════════╝

══════════════════════════════════════════════════════════════════
📅 WEEK 1: June 29 - July 5
══════════════════════════════════════════════════════════════════

📊 Total Notices: 25

 1. [2026-06-29] [(서울)RISE사업단] AI Challenge Announcement
    📍 Campus: Seoul
    ✍️  Author: RISE Team
    📝 Welcome from KHU RISE Team...
    📎 2 attachment(s)

 2. [2026-06-29] Digital Badge Design Contest
    ...
```

---

## 📊 Data by Week

| Week | Period | Notices | Category |
|------|--------|---------|----------|
| 1 | Jun 29-Jul 5 | 25 | Program launches |
| 2 | Jul 6-Jul 12 | 17 | Mid-week activity |
| 3 | Jul 13-Jul 19 | 18 | Building momentum |
| 4 | Jul 20-Jul 26 | **33** | ⭐ **PEAK ACTIVITY** |
| 5 | Jul 27-Aug 2 | 2 | Winding down |
| | **TOTAL** | **95** | **July 2026** |

---

## 🔍 Common Search Patterns

### Find all TA recruitment notices
```bash
grep -i "ta\|교육조교" khu-notices-2026-07/NEWS_BROADCAST.txt
```
**Result**: ~35 notices about teaching assistant positions

### Find job recommendations
```bash
grep -i "채용\|추천\|인턴" khu-notices-2026-07/NEWS_BROADCAST.txt
```
**Result**: ~20 job postings

### Find entrepreneurship programs
```bash
grep -i "창업\|startup" khu-notices-2026-07/NEWS_BROADCAST.txt
```
**Result**: ~15 startup/business programs

### Find language programs
```bash
grep -i "english\|영어\|toeic" khu-notices-2026-07/NEWS_BROADCAST.txt
```
**Result**: 8 language course offerings

### Find Seoul campus notices
```bash
grep "Campus: 서울" khu-notices-2026-07/NEWS_BROADCAST.txt
```
**Result**: 35 notices for Seoul campus

---

## 📑 View Specific Weeks

### Week 4 (July 20-26) - Busiest Week
```bash
cat khu-notices-2026-07/week4.md
```
**Contains**: 33 notices - recruiting season peak

### Week 1 (June 29-July 5) - Program Launches
```bash
cat khu-notices-2026-07/week1.md
```
**Contains**: 25 notices - summer programs and new initiatives

---

## 💻 Programmatic Access

### List all notice titles
```bash
node -e "const d = require('./khu-notices-2026-07/_manifest.json'); d.forEach(n => console.log('- ' + n.title))"
```

### Filter by campus
```bash
node -e "
const d = require('./khu-notices-2026-07/_manifest.json');
const seoul = d.filter(n => n.campus.includes('서울'));
console.log('Seoul Campus Notices: ' + seoul.length);
seoul.forEach(n => console.log('  ' + n.date + ' - ' + n.title));
"
```

### Count by author
```bash
node -e "
const d = require('./khu-notices-2026-07/_manifest.json');
const byAuthor = {};
d.forEach(n => byAuthor[n.author] = (byAuthor[n.author] || 0) + 1);
Object.entries(byAuthor).sort((a,b) => b[1]-a[1]).slice(0,10).forEach(([a,c]) => 
  console.log(a + ': ' + c)
);
"
```

### Export to CSV
```bash
node -e "
const d = require('./khu-notices-2026-07/_manifest.json');
console.log('Date,Title,Author,Campus');
d.forEach(n => console.log(\`\${n.date},\${n.title.replace(/,/g,';')},\${n.author},\${n.campus}\`));
" > notices.csv
```

---

## 🛠️ Maintenance

### Re-run the full crawler
```bash
npm run news
```
**What it does**: Fetches latest data from website → generates new broadcast

### Update just the broadcast
```bash
npm run broadcast
```
**What it does**: Regenerates NEWS_BROADCAST.txt from existing data

### Crawl only
```bash
npm run crawl
```
**What it does**: Downloads data but doesn't generate broadcast

---

## 📂 File Organization

```
khu-notices-2026-07/
├── NEWS_BROADCAST.txt      ← Main file (read this first)
├── week1.md                ← Detailed notices for week 1
├── week2.md                ← Detailed notices for week 2
├── week3.md                ← Detailed notices for week 3
├── week4.md                ← Detailed notices for week 4 (busiest)
├── week5.md                ← Detailed notices for week 5
├── _manifest.json          ← Machine-readable data
├── _raw.json               ← Complete raw data
├── CRAWL_SUMMARY.md        ← Metadata about this crawl
└── images/                 ← 61 downloaded images
    ├── 322525_0.jpg
    ├── 322525_1.pdf
    └── ...
```

---

## 🎯 Use Cases

### University Student?
**"I want to find all TA positions for next semester"**
```bash
grep -i "조교\|ta" khu-notices-2026-07/week4.md | head -20
```

### Job Hunter?
**"Show me all job recommendations"**
```bash
grep -i "추천채용\|정규직" khu-notices-2026-07/NEWS_BROADCAST.txt
```

### Researcher?
**"I need to analyze notice distribution by campus"**
```bash
node -e "
const d = require('./khu-notices-2026-07/_manifest.json');
const byCampus = {};
d.forEach(n => byCampus[n.campus] = (byCampus[n.campus] || 0) + 1);
console.log(JSON.stringify(byCampus, null, 2));
"
```

### Administrator?
**"What was the busiest week in July?"**
```bash
# Answer: Week 4 (July 20-26) with 33 notices
grep "📅 WEEK" khu-notices-2026-07/NEWS_BROADCAST.txt
```

---

## 🔧 Customization

### Change the date range
Edit `scripts/crawl-khu-robust.mjs`:
```javascript
const START = new Date('2026-06-29T00:00:00+09:00')  // Change this
const END = new Date('2026-08-02T23:59:59+09:00')    // Change this
```
Then: `npm run crawl`

### Crawl different notice category
Edit `scripts/crawl-khu-robust.mjs`:
```javascript
const MENU_NO = '200316'  // General (일반)
// const MENU_NO = '200317'  // Academic (학사)
// const MENU_NO = '200318'  // Scholarship (장학)
```
Then: `npm run crawl`

### Add more fields to broadcast
Edit `scripts/generate-broadcast.mjs` to include additional metadata

---

## 📊 Statistics at a Glance

**Total Coverage**: 95 notices  
**Period**: June 29 - August 2, 2026 (5 weeks)  
**Pages Crawled**: 17 of 50 maximum  
**Images Downloaded**: 61 files  
**Data Size**: ~2.1 MB  

**Top Categories**:
- Teaching Assistant Positions: 37%
- Job Recommendations: 21%
- Startup/Business Programs: 16%
- Language/Education: 11%
- Other: 15%

**Campus Distribution**:
- Seoul Campus: 37%
- International Campus: 32%
- Multi-campus: 32%

---

## ✅ You Now Have

- ✅ **Professional news broadcast** ready to share
- ✅ **Weekly summaries** organized by date
- ✅ **Full notice details** in markdown format
- ✅ **Machine-readable JSON** for analysis
- ✅ **Downloaded images** for offline access
- ✅ **Reusable scripts** to re-crawl anytime
- ✅ **Complete documentation** for reference

---

## 🚀 Next Steps

1. **Read the broadcast**: `cat khu-notices-2026-07/NEWS_BROADCAST.txt`
2. **Find what you need**: Use grep to search
3. **Share the data**: Send week files to others
4. **Automate**: Set up cron job to run `npm run news` weekly
5. **Customize**: Edit scripts for your needs

---

Generated: 2026-08-07 16:30 KST  
Source: https://www.khu.ac.kr/kor/user/bbs/BMSR00040/list.do?menuNo=200316
