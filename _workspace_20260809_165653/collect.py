import urllib.request, urllib.parse, re, os, html, sys, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}

BASE = "https://www.khu.ac.kr/kor/user/bbs/BMSR00040/view.do"

# (menuNo, boardId, category, title, date, writer)
NOTICES = [
    (
        "200316",
        "322737",
        "일반",
        "[공공대학원] 씨티-경희대 NGO 인턴십 프로그램 사무국 간사 모집",
        "2026-08-07",
        "공공거버넌스연구소",
    ),
    (
        "200316",
        "322736",
        "일반",
        "[국제교육원(서울)] 2026년 9월 여름2차 3주 단기과정 한국어 도우미 모집",
        "2026-08-07",
        "국제교육원",
    ),
    (
        "200316",
        "322735",
        "일반",
        "[SK그룹 기업 특강 및 그룹 코칭 참여자 모집 안내]",
        "2026-08-07",
        "미래인재센터(서울)",
    ),
    (
        "200316",
        "322734",
        "일반",
        "[(서울)심리상담센터] 2026-2학기 워크숍 수요 조사(~8/30) *2개 문항+이클립스 증정!",
        "2026-08-07",
        "심리상담센터(서울)",
    ),
    (
        "200316",
        "322571",
        "일반",
        "[교수학습개발원] 2026-2학기 CTL서포터즈 7기 모집(~8/13)",
        "2026-08-07",
        "교수학습개발원",
    ),
    (
        "200316",
        "322691",
        "일반",
        "[교수학습개발원] 2026-2학기 슬기로운 경희생활 시리즈 학생강사 모집 (장학금 편 / 다전공 편)",
        "2026-08-07",
        "교수학습개발원",
    ),
    (
        "200316",
        "322726",
        "일반",
        "[추천채용][로지스밸리] 개발사업부문 정규직 추천채용",
        "2026-08-07",
        "미래인재센터(서울)",
    ),
    (
        "200316",
        "322723",
        "일반",
        "[생활관(우정원) 기숙사 조교 모집]",
        "2026-08-07",
        "우정원",
    ),
    (
        "200316",
        "322719",
        "일반",
        "아트퓨전디자인대학원(국제C) 26-2학기 조교 모집 공고",
        "2026-08-07",
        "아트퓨전디자인대학원",
    ),
    (
        "200316",
        "322717",
        "일반",
        "[사단법인 이타서울] 8월 나눔플로깅 참여자 모집 (14일, 26일)",
        "2026-08-07",
        "글로벌봉사팀",
    ),
    (
        "200316",
        "322555",
        "일반",
        "[예술디자인대학 시각디자인학과 조교 모집]",
        "2026-08-06",
        "예술디자인대학",
    ),
    (
        "200316",
        "322712",
        "일반",
        "[교육혁신사업단] 학생기획단×학생정책발굴단 Team2 비교과·대외활동 정보 이용 환경 설문조사 참여 안내",
        "2026-08-06",
        "교육혁신사업단",
    ),
    (
        "200316",
        "322689",
        "일반",
        "[교육혁신사업단] 학생기획단×학생정책발굴단 Team1 교육정보 이용 실태 설문조사 참여 안내",
        "2026-08-06",
        "교육혁신사업단",
    ),
    (
        "200316",
        "322706",
        "일반",
        "[대외협력처(국제)] ★2025학년도 후기학위수여식 후배사랑 기부 이벤트 : 졸업키트 혹은 이름표",
        "2026-08-06",
        "대외협력처(국제)",
    ),
    (
        "200316",
        "322296",
        "일반",
        "[경희대학교 인류사회재건연구원] 등재학술지 OUGHTOPIA(오토피아) 제41권 2호 원고 모집",
        "2026-08-06",
        "미래문명원",
    ),
    (
        "200316",
        "322705",
        "일반",
        "[대외협력처(서울)] ★2025 후기학위수여식 후배사랑 기부 이벤트 : 이름표를 단 쿠옹이 인형★",
        "2026-08-06",
        "대외협력처(국제)",
    ),
    (
        "200316",
        "322523",
        "일반",
        "[공과대학 공동기기원] 2026-2학기 조교 모집",
        "2026-08-06",
        "공동기기원",
    ),
    (
        "200316",
        "322700",
        "일반",
        "국제교육원 2026-2학기 조교 모집(서울)",
        "2026-08-05",
        "국제교육원",
    ),
    (
        "200316",
        "322699",
        "일반",
        "국제교육원 계약직원 모집(서울)",
        "2026-08-05",
        "국제교육원",
    ),
    (
        "200316",
        "322698",
        "일반",
        "[경희대 공공거버넌스연구소] 조교 채용 공고",
        "2026-08-05",
        "공공거버넌스연구소",
    ),
    (
        "200317",
        "322701",
        "학사",
        "[서울] 2025학년도 후기(2026년 8월) 학위수여식 및 포토존 운영 안내",
        "2026-08-05",
        "교무처 학사지원팀(서울)",
    ),
    (
        "200317",
        "322697",
        "학사",
        "[국제] 2025학년도 후기(2026년 8월) 학위수여식 및 포토존 운영 안내",
        "2026-08-05",
        "교무처 학사지원팀(국제)",
    ),
    (
        "200317",
        "322670",
        "학사",
        "2026년 8월 민방위 훈련 안내",
        "2026-08-04",
        "연대본부(국제)",
    ),
    (
        "200318",
        "322718",
        "장학",
        "2026년 5·18 희망장학생 모집 안내",
        "2026-08-07",
        "(서울)학생지원센터",
    ),
    (
        "200318",
        "322715",
        "장학",
        "2026년 하반기 서울인재대학장학금 선발 공고",
        "2026-08-06",
        "(서울)학생지원센터",
    ),
    (
        "200318",
        "322694",
        "장학",
        "2026년 제 2회 서울시 대학생 학자금대출 이자 지원 안내",
        "2026-08-05",
        "(서울)학생지원센터",
    ),
    (
        "200318",
        "322666",
        "장학",
        "2026학년도 2학기 운연장학 신청 안내(~8/14까지)",
        "2026-08-04",
        "(서울)학생지원센터",
    ),
    (
        "200361",
        "322729",
        "근로",
        "2026년도 2학기 경희인턴(교내인턴장학) 모집 안내 - (서울)창업보육센터",
        "2026-08-07",
        "(서울)학생지원센터",
    ),
    (
        "200361",
        "322707",
        "근로",
        "2026년도 2학기 경희인턴(교내인턴장학) 모집 안내 - (서울)시설운영팀 (재공고)",
        "2026-08-06",
        "(서울)학생지원센터",
    ),
    (
        "200361",
        "322685",
        "근로",
        "2026학년도 2학기 국가근로장학생 1차 선발 및 희망근로지 수요조사 안내",
        "2026-08-05",
        "(서울)학생지원센터",
    ),
    (
        "200361",
        "322678",
        "근로",
        "[국가근로] 2026학년도 2학기 국가근로장학 자체선발기준 안내(서울캠퍼스)",
        "2026-08-04",
        "(서울)학생지원센터",
    ),
    (
        "200361",
        "322676",
        "근로",
        "2026년도 2학기 국가근로장학금 2차 신청기간 안내 (2026.08.12~2026.09.09)",
        "2026-08-04",
        "(서울)학생지원센터",
    ),
    (
        "200361",
        "322673",
        "근로",
        "[국가근로] 2026학년도 2학기 국가근로장학 자체선발기준 안내(국제캠퍼스)",
        "2026-08-04",
        "(국제)학생지원센터",
    ),
    (
        "200321",
        "322703",
        "행사",
        "[체육부] 2026 대한항공배 전국대학배구 단양대회 경기일정 안내(충북 단양)",
        "2026-08-06",
        "체육부",
    ),
]

IMG_DIR = "/Users/user/Desktop/casts/_workspace/01_notice_images"
os.makedirs(IMG_DIR, exist_ok=True)


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")


def clean_text(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"</p>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t\u00a0]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n\n", s)
    return s.strip()


def extract_detail(menuNo, boardId):
    url = f"{BASE}?menuNo={menuNo}&boardId={boardId}&pageIndex=1"
    page = fetch(url)
    m = re.search(
        r'<div class="row contents clearfix">(.*?)<div class="row addFile', page, re.S
    )
    if not m:
        m = re.search(
            r'<div class="row contents clearfix">(.*?)(<div class="row addFile|</div>\s*</div>\s*<div class="btnW)',
            page,
            re.S,
        )
    if not m:
        return "", []
    content_html = m.group(1)
    text = clean_text(content_html)
    imgs = re.findall(r'<img[^>]+src="([^"]+)"', content_html)
    return text, imgs


def download_image(url, idx, boardId):
    if url.startswith("//"):
        url = "https:" + url
    elif url.startswith("/"):
        url = "https://www.khu.ac.kr" + url
    parsed = urllib.parse.urlsplit(url)
    quoted = urllib.parse.quote(parsed.path, safe="/%")
    url = urllib.parse.urlunsplit(
        (parsed.scheme, parsed.netloc, quoted, parsed.query, "")
    )
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1] or ".jpg"
    if len(ext) > 5:
        ext = ".jpg"
    fname = f"{boardId}_img{idx}{ext}"
    path = os.path.join(IMG_DIR, fname)
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            data = r.read()
        with open(path, "wb") as f:
            f.write(data)
        return fname, len(data)
    except Exception as e:
        return None, str(e)


report = []
results = []

for menuNo, boardId, cat, title, date, writer in NOTICES:
    try:
        text, imgs = extract_detail(menuNo, boardId)
    except Exception as e:
        report.append(f"- {boardId} {title}: FETCH ERROR {e}")
        results.append(
            (cat, title, date, writer, f"FETCH ERROR: {e}", [], menuNo, boardId)
        )
        continue
    img_notes = []
    for i, u in enumerate(imgs, 1):
        fn, sz = download_image(u, i, boardId)
        if fn:
            img_notes.append(fn)
        else:
            report.append(f"- {boardId} image{i}: {u} -> {sz}")
    results.append((cat, title, date, writer, text, img_notes, menuNo, boardId))
    report.append(f"- {boardId} [{cat}] {title} ({date}): OK, imgs={len(img_notes)}")
    print(f"OK {boardId} {title}", flush=True)

# Write notice markdown
md = []
md.append("# 경희대학교 공지사항 (2026-08-03 ~ 2026-08-07)")
md.append("")
md.append("> 작성일: 2026-08-08 (토) | 스크래핑된 금주(월~금) 공지사항")
md.append("")
by_cat = {}
for r in results:
    by_cat.setdefault(r[0], []).append(r)

for cat in ["일반", "학사", "장학", "근로", "행사"]:
    items = by_cat.get(cat, [])
    md.append(f"## {cat} ({len(items)}건)")
    md.append("")
    for cat_, title, date, writer, text, imgs, menuNo, boardId in items:
        url = f"{BASE}?menuNo={menuNo}&boardId={boardId}&pageIndex=1"
        md.append(f"### [{date}] {title}")
        md.append("")
        md.append(f"- 작성자: {writer}")
        md.append(f"- 링크: {url}")
        md.append("")
        if text:
            md.append(text)
        else:
            md.append("(본문을 가져올 수 없거나 이미지로 구성됨)")
        if imgs:
            md.append("")
            md.append(f"- 포함 이미지: {', '.join(imgs)}")
        md.append("")

with open("/Users/user/Desktop/casts/_workspace/01_notice.md", "w") as f:
    f.write("\n".join(md))

with open("/Users/user/Desktop/casts/_workspace/01_scraping_report.md", "w") as f:
    f.write("# 스크래핑 보고서\n\n")
    f.write(f"- 수집 대상 기간: 2026-08-03(월) ~ 2026-08-07(금)\n")
    f.write(f"- 전체 카테고리: 일반 / 학사 / 장학 / 근로 / 행사 (5개)\n")
    f.write(f"- 수집된 공지 수: {len(results)}건\n")
    f.write(f"- 다운로드 이미지 디렉토리: _workspace/01_notice_images/\n\n")
    f.write("## 항목별 결과\n\n")
    f.write("\n".join(report))
    f.write("\n")

print("DONE", len(results), "notices")
