---
name: news-orchestrator
description: "radio news 자동 제작 오케스트레이터. scraping the contents부터 news 생성, speech file 빌드까지 5명의 에이전트 팀(art-collector, ocr-director, scenarist, news-builder, qa-reviewer)을 조율한다. 트리거: 'need news' 등 news 관련 모든 후속 요청도 반드시 이 스킬을 사용."
---

# News Orchestrator — Radio News 제작 통합 워크플로우

5명의 에이전트 팀이 협업하여 scraping the contents → summarizing the contents → scenario creation → speech file 빌드를 완성하는 통합 스킬.

## 실행 모드: 하이브리드

| Phase                         | 모드          | 이유                                              |
| ----------------------------- | ------------- | ------------------------------------------------- |
| Phase 2 (notice-organization) | 에이전트 팀   | collector ↔ ocr-director 가 즉시 피드백 교환      |
| Phase 3 (news-creation)       | 에이전트 팀   | scenarist ↔ news-builder 가 즉시 피드백 교환      |
| Phase 4 (reviewing)           | 서브 에이전트 | qa-reviewer 단일이 confirm news files are working |

## 에이전트 구성

| 팀원         | agent_type   | 역할                                                                       | 출력                                                                                                              |
| ------------ | ------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| collector    | collector    | KHU notice board scraping                                                  | `_workspace/01_{monthweeknumber}_notice.json` + `_workspace/01_{monthweeknumber}_notice.md` + `_workspace/01_notice_images/` + `_workspace/01_scraping_report.md` |
| ocr-director | ocr-director | OCR processing to notify collector to jot notices in text in markdown file | `_workspace/02_ocr_results.md`                                                                                    |
| scenarist    | scenarist    | 뉴스 시나리오 작성                                                         | `_workspace/03_news_scenario.md`                                                                                  |
| news-builder | news-builder | 뉴스 파일 빌드                                                             | `_workspace/04_news_files/`                                                                                       |
| qa-reviewer  | qa-reviewer  | confirm news file 검증                                                     | `_workspace/05_qa_report.md`                                                                                      |

## 워크플로우

### Phase 1: 컨텍스트 확인

1. `_workspace/` files 존재 여부 확인.
2. 실행 모드 결정:
   - `_workspace/` files 존재 + 사용자가 부분 수정 요청 → **부분 재실행** (해당 에이전트만 호출)
   - `_workspace/01_{monthweeknumber}_notice.md` files 존재 → **새 실행**, 기존 `_workspace/` 와 `news/` 를 각각 `_workspace_{timestamp}/`, `news_{timestamp}/` 로 보관 후 new process start
3. 디렉토리 보장: `_workspace/`, `news/`

### Phase 2: notice-organization (팀)

**실행 모드:** 에이전트 팀

1. Lead: "Spawn collector and ocr-director teammates. collector collects notices in KHU notice board. collector sends image files in notices to ocr-director for validation. ocr-director reads texts from image files and sends them to collector. collector jots down the notices in a markdown file."
   - collector → `_workspace/01_{monthweeknumber}_notice.json` + `_workspace/01_{monthweeknumber}_notice.json` + `_workspace/01_{monthweeknumber}_notice.md` + `_workspace/01_notice_images/` + `_workspace/01_scraping_report.md` 출력
   - ocr-director → `_workspace/02_ocr_results.md` 출력
2. Teammates automatically coordinate through shared task list and direct messaging until PASS
3. Lead receives completion notification

### Phase 3: news-creation (팀)

**실행 모드:** 에이전트 팀

1. Lead: "Spawn scenarist and news-builder teammates. scenarist creates the news scenario. news-builder builds speech files from the scenario."
   - scenarist → `_workspace/03_news_scenario.md` 출력
   - news-builder → `_workspace/04_news_files/` 출력
2. Teammates automatically coordinate through shared task list and direct messaging until PASS
3. Lead receives completion notification

### Phase 4: reviewing (서브)

**실행 모드:** 서브 에이전트

1. `Agent(name: qa-reviewer, subagent_type: qa-reviewer, prompt: "qa the news files in _workspace/04_news_files/ and report the results")`
   - 백그라운드 실행, 새 책을 books/library.json 에 추가 및 library home 리빌드
   - 완료 후 `_workspace/` 보존
2. 사용자에게 결과 보고: QA 결과, 라이브러리 업데이트 완료

## 데이터 흐름

```
사용자 입력
    ↓
[collector] ↔ [ocr-director]
    ↓
01_{monthweeknumber}.json + 01_{monthweeknumber}.md + 02_ocr_results.md
    ↓
[scenarist] ↔ [news-builder]
    ↓
03_news_scenario.md + 04_news_files/
    ↓
[qa-reviewer]
    ↓
05_qa_report.md
    ↓
사용자 (find news in main page)
```

<!-- ## 에러 핸들링

| 상황              | 전략                                                             |
| ----------------- | ---------------------------------------------------------------- |
| 이미지 일부 누락  | 누락 장면 1회 재시도, 그래도 실패 시 placeholder + 보고서에 명시 |
| 이미지 전체 실패  | 사용자에게 보고, 텍스트만 있는 뷰어 빌드 여부 확인               |
| book-builder 실패 | 최소 단일 페이지 fallback HTML 생성                              |
| qa-reviewer FAIL  | 문제 모듈에게 1회 수정 요청, 재실패 시 PARTIAL 로 마무리         |
| librarian 실패    | books/library.json 업데이트 생략, 개별 책은 정상 완성으로 보고   |

## 테스트 시나리오

### 정상 흐름

1. 사용자: "동화책 만들어줘"
2. Phase 2: art-director 가 11장면 시나리오 + 일관된 watercolor 스타일 + 12개 영문 프롬프트 생성
3. Phase 3: illustrator 가 이미지 배치로 약 5분 만에 12장 생성
4. Phase 4: book-builder 가 HTML 뷰어, qa-reviewer 가 PASS
5. Phase 5: librarian 이 books/library.json 을 업데이트, 루트 index.html (라이브러리 홈) 리빌드
6. 사용자가 루트 `index.html` 을 열면 라이브러리 홈에서 신규 책 카드 확인, 클릭 시 개별 책 뷰어로 진입

### 에러 흐름 (이미지 1장 실패)

1. Phase 3 후 `book/images/scene_05.png` 누락 발견
2. illustrator 가 scene_05 만 단일 재시도
3. 재시도 성공 → 정상 진행, 또는 실패 → placeholder + 보고서 명시
4. book-builder 가 placeholder 처리하여 뷰어 빌드
5. qa-reviewer 가 PARTIAL 로 보고
6. Phase 5: librarian 이 라이브러리 업데이트 (PARTIAL 표시 포함)

## description 의 후속 작업 키워드

이 description 은 다음 후속 요청에서도 반드시 트리거되어야 한다:

- "장면 3 수정", "이미지 다시 그려", "스타일 바꿔", "뷰어 색감 변경"
- "이전 책 개선", "표지만 바꿔", "엔딩 메시지 수정" -->
