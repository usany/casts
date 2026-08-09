# Radio News 프로젝트

## 하네스: Radio News 자동 제작

**목표:** Scraping this week's KHU notice board using playwright → Read texts from image files using easyocr (if needed) → Make news scenario from notice contents → Radio news generation using gemini-tts.

**트리거:** need news 요청이 들어오면 `news-orchestrator` 스킬을 사용하라. 단순 질문(예: "이 폴더에 뭐가 있어?") 은 직접 응답.

**에이전트:** `.claude/agents/` — collector, ocr-director, scenarist, news-builder, qa-reviewer
**스킬:** `.claude/skills/` — news-orchestrator (오케스트레이터), scraping, ocr-processing, scenario-direction, news-building, reviewing
**산출물 위치:** `news/` (최종), `_workspace/` (중간)

**Speech 생성:** Gemini-tts 생성 기능을 사용합니다.

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
| ---- | --------- | ---- | ---- |
| 2026-08-09 | 2026-08-03~07 주차 KHU 공지 34건 스크래핑 → 라디오 뉴스 시나리오(44줄) → TTS 음성 클립 44개 + full_news.wav(8:40) 생성. Gemini TTS 무료 쿼터 초과로 macOS `say`(Yuna) 폴백. 최종 산출물을 news/2026_08_w1/ 및 public/news/2026-08-08-week1.wav로 복사하고 앱 EPISODES에 연결 | _workspace/, news/, public/news/, app/lib/utils.js | 이번 주 라디오 뉴스 자동 제작 |
| 2026-08-09 | `say` 폴백 음성(Yuna, 단일 화자)을 `edge-tts`로 교체 재생성: 호스트=ko-KR-SunHiNeural(여), 리포터=ko-KR-InJoonNeural(남) 화자 구분. full_news.wav 610.6초(10:10)로 재생성, QA 보고서·EPISODES 갱신. `_workspace/tts_edge.py` 추가 | _workspace/tts_edge.py, _workspace/04_news_files/, news/2026_08_w1/, public/news/, app/lib/utils.js | 교차플랫폼 TTS + 화자별 목소리 구분 |
| 2026-08-09 | 2026-07-20~24 주차 KHU 공지 19건 스크래핑 → 라디오 뉴스 시나리오(35줄, 뉴스 7개 섹션) → edge-tts 음성 클립 35개 + full_news.wav(521.9초/8:41) 생성, QA PASS. 최종 산출물을 news/2026_07_w3/ 및 public/news/2026-07-27-week3.wav로 복사, 앱 EPISODES에 연결. 기존 8월 1주차 산출물은 _workspace_20260809_165656/, news_20260809_165656/로 보관 | _workspace/, news/, public/news/, app/lib/utils.js | 이전(7월 3주차) 라디오 뉴스 자동 제작 |
