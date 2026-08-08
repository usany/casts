# Radio News 프로젝트

## 하네스: Radio News 자동 제작

**목표:** 시나리오 작성 → 일관된 그림책 일러스트 → 정적 HTML 책 뷰어를 한 번에 완성.

**트리거:** new book 요청이 들어오면 `fairy-tale-orchestrator` 스킬을 사용하라. 단순 질문(예: "이 폴더에 뭐가 있어?") 은 직접 응답.

**에이전트:** `.claude/agents/` — storyteller, art-director, illustrator, book-builder, qa-reviewer
**스킬:** `.claude/skills/` — fairy-tale-orchestrator (오케스트레이터), story-writing, art-direction, image-generation-batch, book-viewer
**산출물 위치:** `book/` (최종), `_workspace/` (중간)

**이미지 생성:** Claude의 이미지 생성 기능을 사용합니다. 외부 의존성 없음.

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
| ---- | --------- | ---- | ---- |
