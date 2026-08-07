# 📻 Two-Person Dialogue Format Update

**Updated:** 2026-08-07 18:16 KST  
**Change:** Simplified to two-person dialogue (anchor + one reporter)

---

## What Changed

The Korean broadcast transcriptions now feature a **consistent two-person dialogue** between:
- **앵커** (Anchor)
- **리포터** (Reporter)

### BEFORE (Multiple Reporters)
```markdown
**앵커:** ...리포터 1, 전해주시겠어요?
**리포터 1:** 네, 앵커님...

**앵커:** ...리포터 2, 어떤 내용인가요?
**리포터 2:** 말씀드리겠습니다...

**앵커:** ...리포터 3께서 설명해주시죠.
**리포터 3:** 알려드리죠...

[Closing]
**리포터들:** 청취해주신 모든 분들께 감사드립니다!
```

### AFTER (Two-Person Dialogue)
```markdown
**앵커:** ...리포터, 전해주시겠어요?
**리포터:** 네, 앵커님...

**앵커:** ...리포터, 어떤 내용인가요?
**리포터:** 말씀드리겠습니다...

**앵커:** ...리포터께서 설명해주시죠.
**리포터:** 알려드리죠...

[Closing]
**리포터:** 청취해주신 모든 분들께 감사드립니다!
```

---

## Why This Change?

### Benefits

✅ **Simpler casting** - Only need 2 voice actors/TTS voices  
✅ **More natural** - Like a real news broadcast with main anchor + field reporter  
✅ **Consistent voices** - Same reporter voice throughout  
✅ **Easier production** - No need to coordinate multiple reporter voices  
✅ **Better flow** - Consistent back-and-forth dialogue  
✅ **Professional format** - Standard broadcast format (anchor + correspondent)  

### Real Broadcast Format

Most news broadcasts use:
- **Main Anchor** - Studio host who introduces topics
- **Correspondent/Reporter** - Reports all field/desk stories

This mirrors professional news programs like:
- BBC News (anchor + correspondent)
- NPR News (host + reporter)
- Korean KBS/MBC/SBS news (앵커 + 기자)

---

## Examples

### Week 5, Segment 1
```markdown
**앵커:**
다음은 2026-07-29에 게시된 국제의 공지사항입니다. 공통 캠퍼스 소식인데요, 리포터, 전해주시겠어요?

**리포터:**
네, 앵커님. 국제에서 "[창업교육센터] KHU Valley Program(KVP) 15기 모집 안내..." 공지를 발표했습니다. 
지원자 모집 공고입니다. 마감일은 7월 31일까지입니다.

공지 내용을 살펴보면, 창업교육센터에서는 KHU Valley Program(KVP) 15기를 모집 하오니...

**앵커:**
감사합니다. 자세한 사항은 공식 홈페이지를 확인해주시기 바랍니다.
```

### Week 5, Segment 2
```markdown
**앵커:**
2026-07-30자 국제교육원에서 올라온 공지사항이 있습니다. 공통 캠퍼스에서 보내온 소식이죠. 리포터, 어떤 내용인가요?

**리포터:**
말씀드리겠습니다. 국제교육원가 "[국제교육원] 2026년 여름 1차 단기과정 도우미 모집..." 제목으로 안내문을 올렸습니다.
참가자를 모집하는 내용이에요.

내용을 보시면, 2026년 여름 1차 단기과정 도우미 모집(간담회)...

**앵커:**
네, 알겠습니다. 학생 여러분께서는 게시판에서 상세 내용을 확인하실 수 있습니다.
```

### Week 1, Multiple Segments
```markdown
## 세그먼트 1
**앵커:** ...리포터, 전해주시겠어요?
**리포터:** 네, 앵커님...
**앵커:** 감사합니다...

## 세그먼트 2
**앵커:** ...리포터, 어떤 내용인가요?
**리포터:** 말씀드리겠습니다...
**앵커:** 네, 알겠습니다...

## 세그먼트 3
**앵커:** ...리포터께서 설명해주시죠.
**리포터:** 알려드리죠...
**앵커:** 잘 들었습니다...

## 세그먼트 4
**앵커:** ...리포터, 자세한 내용 부탁드립니다.
**리포터:** 전해드립니다...
**앵커:** 알려주셔서 감사합니다...

## 세그먼트 5
**앵커:** ...리포터?
**리포터:** 네...
**앵커:** 전해주셔서 고맙습니다...
```

---

## Closing Format

### BEFORE
```markdown
**리포터들:**
청취해주신 모든 분들께 감사드립니다!
```

### AFTER
```markdown
**리포터:**
청취해주신 모든 분들께 감사드립니다!
```

---

## Dialogue Variety Maintained

The anchor still uses 5 different introduction variations:
1. "...리포터, 전해주시겠어요?"
2. "...리포터, 어떤 내용인가요?"
3. "...리포터께서 설명해주시죠."
4. "...리포터, 자세한 내용 부탁드립니다."
5. "...리포터?"

The reporter still uses 5 different opening variations:
1. "네, 앵커님..."
2. "말씀드리겠습니다..."
3. "알려드리죠..."
4. "전해드립니다..."
5. "네..."

**Result:** Natural variety maintained, but with consistent two-person format!

---

## Voice Production

### For TTS (Text-to-Speech)
```bash
# Only need 2 voices
ANCHOR_VOICE="ko-KR-Standard-A"  # Female anchor voice
REPORTER_VOICE="ko-KR-Standard-B"  # Male reporter voice

# Or reverse
ANCHOR_VOICE="ko-KR-Standard-C"  # Male anchor voice
REPORTER_VOICE="ko-KR-Standard-D"  # Female reporter voice
```

### For Voice Actors
- Cast 1 person as Anchor (studio host)
- Cast 1 person as Reporter (field correspondent)
- Record all segments with same two voices

---

## Technical Changes

### Script Updates
**File:** `scripts/enhance-broadcast-korean.mjs`

**Changes:**
1. Removed `num` parameter from anchor intro functions
2. Changed `**리포터 ${noticeNum}:**` to `**리포터:**`
3. Updated closing from `**리포터들:**` to `**리포터:**`
4. Anchor addresses reporter as "리포터" (no numbers)

---

## Files Updated

All 5 enhanced Korean transcriptions regenerated:

- ✅ `week1_broadcast_transcription_ko_enhanced.md` (25 notices)
- ✅ `week2_broadcast_transcription_ko_enhanced.md` (17 notices)
- ✅ `week3_broadcast_transcription_ko_enhanced.md` (18 notices)
- ✅ `week4_broadcast_transcription_ko_enhanced.md` (33 notices)
- ✅ `week5_broadcast_transcription_ko_enhanced.md` (2 notices)

**Total:** 95 notices with two-person dialogue format

---

## Quality Verification

✅ All segments use consistent two-person format  
✅ No numbered reporters (Reporter 1, 2, 3, etc.)  
✅ Single "리포터" throughout  
✅ Natural dialogue variety maintained  
✅ Professional broadcast format  
✅ Easier for voice production  
✅ Consistent speaker labels  

---

## Comparison

### Cast Complexity

| Format | Speakers | Voice Actors Needed | TTS Voices |
|--------|----------|---------------------|------------|
| Before | Anchor + Multiple Reporters | 1 + N | 1 + N |
| After | Anchor + One Reporter | 2 | 2 |

For Week 1 (25 notices):
- **Before:** 1 anchor + 25 reporters = 26 voices needed
- **After:** 1 anchor + 1 reporter = 2 voices needed

**Simplification:** 92% fewer voices needed!

---

## Usage

The files are ready for two-person broadcast production:

```bash
# Files ready with two-person format
cat khu-notices-2026-07/week1_broadcast_transcription_ko_enhanced.md

# Regenerate if needed
npm run enhance:broadcast-ko
```

---

## Summary

✅ Simplified to professional two-person broadcast format  
✅ Easier voice casting and production  
✅ Consistent reporter voice throughout  
✅ Natural dialogue variety maintained  
✅ Professional broadcast standard  
✅ All 95 notices updated  

---

**Update completed:** 2026-08-07 18:16 KST  
**Format:** Two-person dialogue (앵커 + 리포터)  
**Status:** ✅ Ready for broadcast production
