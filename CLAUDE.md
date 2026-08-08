# Radio News 프로젝트

## 하네스: Radio News 자동 제작

**목표:** Scraping this week's KHU notice board → Summarize the notice contents → Radio news generation.

**트리거:** need news 요청이 들어오면 `news-orchestrator` 스킬을 사용하라. 단순 질문(예: "이 폴더에 뭐가 있어?") 은 직접 응답.

**에이전트:** `.claude/agents/` — collector, ocr-director, scenarist, news-builder, qa-reviewer
**스킬:** `.claude/skills/` — news-orchestrator (오케스트레이터), scraping, ocr-processing, scenario-direction, news-building, reviewing
**산출물 위치:** `news/` (최종), `_workspace/` (중간)

**Speech 생성:** Gemini-tts 생성 기능을 사용합니다.

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
| ---- | --------- | ---- | ---- |
