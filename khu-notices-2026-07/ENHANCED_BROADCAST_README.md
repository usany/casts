# 📻 Enhanced Korean Broadcast Transcriptions

## What's New?

The enhanced Korean broadcast transcriptions now include **detailed content descriptions** pulled directly from the weekly notice files.

### Comparison

#### Before (Standard Korean Transcription)
```markdown
**리포터 1:**

물론이죠! "[창업교육센터] KHU Valley Program(KVP) 15기 모집 안내( ~7.31 17시)(모집기간 연장)"

공지사항의 내용: "창업교육센터에서는 KHU Valley Program(KVP) 15기를 모집 하오니 학생 여러분의 많은 관심과 적극적인 신청을 부탁드립니다."
```

#### After (Enhanced Korean Transcription)
```markdown
**리포터 1:**

물론이죠! "[창업교육센터] KHU Valley Program(KVP) 15기 모집 안내( ~7.31 17시)(모집기간 연장)"

**주요 정보:** ⏰ 마감: 7.31 

공지사항의 카테고리: "모집"

**공지 내용:** "창업교육센터에서는 KHU Valley Program(KVP) 15기를 모집 하오니 학생 여러분의 많은 관심과 적극적인 신청을 부탁드립니다. 아울러 주변에 창업에 관심있는 학생들에게도 본 프로그램을 안내해 주시면 감사하겠습니다. ※ 프로그램별 세부 내용, 일정 및 신청 방법은 공고문 파일을 반드시 확인해 주시기 바랍니다..."
```

## Enhancements

### 1. **Deadline Information** ⏰
- Automatically extracts deadlines from notice titles
- Displays in format: `⏰ 마감: 7.31`
- Helps listeners identify time-sensitive announcements

### 2. **Content Categories** 📁
- Classifies notices by type:
  - `모집` (Recruitment/Application)
  - `행사` (Events)
  - `채용` (Employment)
  - `수강신청` (Course Registration)
  - `공지사항` (General Announcement)

### 3. **Richer Content Descriptions** 📝
- Includes full excerpt text from original notices
- Up to 300 characters of content detail
- Preserves important information and context
- More informative for listeners

### 4. **Better Department Information** 🏢
- Extracts department names from author field
- Displays campus location clearly
- Provides organizational context

## File Organization

```
khu-notices-2026-07/
├── week1_broadcast_transcription_ko.md           # Standard translation
├── week1_broadcast_transcription_ko_enhanced.md  # Enhanced with descriptions
├── week2_broadcast_transcription_ko.md
├── week2_broadcast_transcription_ko_enhanced.md
├── week3_broadcast_transcription_ko.md
├── week3_broadcast_transcription_ko_enhanced.md
├── week4_broadcast_transcription_ko.md
├── week4_broadcast_transcription_ko_enhanced.md
├── week5_broadcast_transcription_ko.md
└── week5_broadcast_transcription_ko_enhanced.md
```

## Usage

### Generate Enhanced Transcriptions

```bash
# Run the enhancement script directly
node scripts/enhance-broadcast-korean.mjs

# Or use the npm script
npm run enhance:broadcast-ko

# Full workflow (English → Korean → Enhanced)
npm run broadcast:ko
```

### Using the Files

The enhanced files can be used for:
- **Audio Production**: Text-to-speech with more detailed narration
- **Video Subtitles**: Richer captions for Korean viewers
- **Distribution**: Share with Korean-speaking audience with more context
- **Archive**: Better documentation of weekly announcements

## Technical Details

### Content Extraction
- Parses week markdown files (`week1.md`, `week2.md`, etc.)
- Extracts notice metadata (title, date, author, campus)
- Pulls full content text from original markdown
- Identifies and classifies notice types

### Deadline Parsing
- Searches for date patterns in notice titles
- Extracts dates in formats: `7.31`, `7/31`, etc.
- Formats as readable information for listeners

### Category Classification
- Uses keyword patterns to identify notice type
- Matches against common Korean terms
- Defaults to generic "공지사항" if unclear

## Statistics

### Generated Files (Week 5 Example)
- Total Notices: 2
- Enhanced Descriptions: 2
- File Size: ~5KB (enhanced) vs ~2KB (standard)

### Full Dataset
| Week | Standard | Enhanced | Notices | 
|------|----------|----------|---------|
| Week 1 | ✅ | ✅ | 25 |
| Week 2 | ✅ | ✅ | 17 |
| Week 3 | ✅ | ✅ | 18 |
| Week 4 | ✅ | ✅ | 33 |
| Week 5 | ✅ | ✅ | 2 |
| **Total** | **5** | **5** | **95** |

## Reporter Dialogue Quality

Enhanced transcriptions feature:
- ✅ More substantive reporter descriptions
- ✅ Actual content details instead of generic summaries
- ✅ Time-sensitive information (deadlines)
- ✅ Notice categorization
- ✅ Department and campus context
- ✅ Full notice excerpts (not truncated)

## Next Steps

1. **Voice Production**: Use enhanced text with Korean TTS
2. **Quality Review**: Check translations and content accuracy
3. **Distribution**: Share with Korean campus community
4. **Feedback**: Gather listener feedback for future improvements
5. **Iteration**: Refine categories and content extraction

## Notes

- Enhanced files use `_ko_enhanced.md` naming convention
- Original English and Korean versions remain unchanged
- Can regenerate anytime by running the script
- No additional dependencies required
- Processing time: ~1-2 seconds for full dataset

---

**Enhancement completed: 2026-08-07**  
*For questions, refer to the broadcast generation and enhancement scripts in the scripts/ directory.*
