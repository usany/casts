import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Enhanced content extraction - pulls detailed summaries from notice content
function parseWeekMarkdownEnhanced(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let week = 0;
  let dateRange = "";
  let totalNotices = 0;
  const notices = [];

  let currentNotice = null;
  let excerptLines = [];
  let contentStarted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract week number and date range
    if (line.includes("Week")) {
      const match = line.match(/Week\s+(\d+)\s+\(([^)]+)\)/i);
      if (match) {
        week = parseInt(match[1]);
        dateRange = match[2];
      }
    }

    // Extract total notices
    if (line.includes("**Notices**:")) {
      const match = line.match(/:\s*(\d+)/);
      if (match) totalNotices = parseInt(match[1]);
    }

    // Parse notice headers (start of new notice)
    if (line.startsWith("###")) {
      if (currentNotice && currentNotice.title) {
        // Save full excerpt
        currentNotice.excerpt = excerptLines
          .join(" ")
          .substring(0, 300)
          .trim();
        notices.push(currentNotice);
      }

      // Extract title and remove special markers
      let title = line.replace(/^###\s*/, "").trim();
      const featured = title.includes("★");
      title = title.replace(/★/g, "").trim();

      currentNotice = {
        date: "",
        title: title,
        campus: "",
        author: "",
        excerpt: "",
        attachments: 0,
        images: 0,
        featured: featured,
        keywords: [],
        deadline: "",
        department: "",
      };
      excerptLines = [];
      contentStarted = false;

      // Look ahead for metadata line (starts with ">")
      if (i + 1 < lines.length && lines[i + 1].startsWith(">")) {
        const metaLine = lines[i + 1];
        // Parse: > Campus: xxx | Date: xxx | Author: xxx | ...

        const campusMatch = metaLine.match(/Campus:\s*([^|]+)/);
        if (campusMatch) currentNotice.campus = campusMatch[1].trim();

        const dateMatch = metaLine.match(/Date:\s*([\d-]+)/);
        if (dateMatch) currentNotice.date = dateMatch[1].trim();

        const authorMatch = metaLine.match(/Author:\s*([^|]+)/);
        if (authorMatch) {
          const author = authorMatch[1].trim();
          currentNotice.author = author;
          // Extract department from author field
          const deptMatch = author.match(/\(([^)]+)\)/);
          if (deptMatch) {
            currentNotice.department = deptMatch[1].trim();
          }
        }
      }
    } else if (line.startsWith(">") && currentNotice && !currentNotice.date) {
      // Parse metadata line
      const campusMatch = line.match(/Campus:\s*([^|]+)/);
      if (campusMatch) currentNotice.campus = campusMatch[1].trim();

      const dateMatch = line.match(/Date:\s*([\d-]+)/);
      if (dateMatch) currentNotice.date = dateMatch[1].trim();

      const authorMatch = line.match(/Author:\s*([^|]+)/);
      if (authorMatch) {
        const author = authorMatch[1].trim();
        currentNotice.author = author;
        const deptMatch = author.match(/\(([^)]+)\)/);
        if (deptMatch) {
          currentNotice.department = deptMatch[1].trim();
        }
      }
    } else if (line.startsWith("**Attachments**:") && currentNotice) {
      const match = line.match(/:\s*\[(.*?)\]/);
      if (match) {
        currentNotice.attachments = (match[1].match(/\[.*?\]/g) || []).length;
      }
    } else if (line.startsWith("**Images**:") && currentNotice) {
      const match = line.match(/:\s*(\d+)/);
      if (match) currentNotice.images = parseInt(match[1]);
    } else if (
      currentNotice &&
      !contentStarted &&
      line.trim() &&
      !line.startsWith("#") &&
      !line.startsWith(">") &&
      !line.startsWith("**") &&
      !line.startsWith("-") &&
      line.length > 20
    ) {
      contentStarted = true;
      excerptLines.push(line);
    } else if (contentStarted && line.trim() && !line.startsWith("#")) {
      // Collect content lines for summary
      if (line.length > 10 && excerptLines.length < 5) {
        excerptLines.push(line);
      }
    }
  }

  if (currentNotice && currentNotice.title) {
    currentNotice.excerpt = excerptLines
      .join(" ")
      .substring(0, 300)
      .trim();
    notices.push(currentNotice);
  }

  return { week, dateRange, totalNotices, notices };
}

// Generate rich Korean broadcast transcription with detailed content descriptions
function generateKoreanTranscriptionEnhanced(weekData) {
  const { week, dateRange, totalNotices, notices } = weekData;

  const campusTranslations = {
    서울: "Seoul Campus",
    국제: "International Campus",
    광릉: "Gwangneung Campus",
    공통: "Global Campus",
  };

  let transcription = `# 📻 경희대 뉴스 방송 기록 - WEEK ${week}

> 앵커 & 리포터 대화

**📅 방송 날짜:** ${dateRange}  
**📊 총 공지사항:** ${totalNotices}

---

## [오프닝]

**앵커:**

안녕하세요, 여러분! 경희대학교 주간 뉴스 방송입니다. 저는 앵커로서 이번 주 경희대학교의 가장 중요한 소식들을 전해드립니다.

이번에는 ${totalNotices} 개의 공지사항이 있으며, 다양한 부서와 캠퍼스 시설의 공지사항을 다룹니다. 시작하겠습니다!

---

`;

  // Variety phrases for natural dialogue
  const anchorIntros = [
    (date, dept, campus) => `다음은 ${date}에 게시된 ${dept}의 공지사항입니다. ${campus} 캠퍼스 소식인데요, 리포터, 전해주시겠어요?`,
    (date, dept, campus) => `${date}자 ${dept}에서 올라온 공지사항이 있습니다. ${campus} 캠퍼스에서 보내온 소식이죠. 리포터, 어떤 내용인가요?`,
    (date, dept, campus) => `이번에는 ${dept}의 소식입니다. ${date}에 ${campus} 캠퍼스에서 발표된 내용인데요, 리포터께서 설명해주시죠.`,
    (date, dept, campus) => `${campus} 캠퍼스 ${dept}에서 ${date}에 발표한 공지사항입니다. 리포터, 자세한 내용 부탁드립니다.`,
    (date, dept, campus) => `계속해서 ${dept}의 공지사항 전해드립니다. ${date} ${campus} 캠퍼스 소식이에요. 리포터?`,
  ];

  const reporterStarts = [
    (dept, title) => `네, 앵커님. ${dept}에서 "${title}" 공지를 발표했습니다.`,
    (dept, title) => `말씀드리겠습니다. ${dept}가 "${title}" 제목으로 안내문을 올렸습니다.`,
    (dept, title) => `알려드리죠. ${dept}의 "${title}" 공지사항입니다.`,
    (dept, title) => `전해드립니다. ${dept}에서 "${title}"라는 제목의 공지를 게시했습니다.`,
    (dept, title) => `네. ${dept}가 "${title}" 내용으로 공지했습니다.`,
  ];

  const categoryPhrases = {
    모집: [
      "지원자 모집 공고입니다.",
      "참가자를 모집하는 내용이에요.",
      "신청자를 받는다고 합니다.",
      "모집 안내 소식입니다.",
    ],
    행사: [
      "행사 안내 공지입니다.",
      "이번 행사를 알리는 내용이에요.",
      "행사 개최 소식입니다.",
      "행사 참가 관련 안내입니다.",
    ],
    채용: [
      "채용 공고 소식입니다.",
      "직원 모집 안내입니다.",
      "인력 채용 공고네요.",
      "채용 관련 공지입니다.",
    ],
    수강신청: [
      "수강 신청 안내입니다.",
      "강좌 신청 관련 내용입니다.",
      "수강 관련 공지사항입니다.",
      "강의 신청 안내 소식입니다.",
    ],
    default: [
      "학생들에게 알리는 공지사항입니다.",
      "안내 사항을 전하는 내용입니다.",
      "학교 측에서 공지한 내용입니다.",
      "알림 사항입니다.",
    ],
  };

  const contentIntros = [
    "공지 내용을 살펴보면,",
    "내용을 보시면,",
    "주요 내용은 다음과 같습니다.",
    "안내 내용입니다.",
    "자세한 내용 말씀드리면,",
  ];

  const contentOutros = [
    "이와 같이 안내하고 있습니다.",
    "라고 밝혔습니다.",
    "라고 전했습니다.",
    "라고 공지했습니다.",
    "라는 내용입니다.",
  ];

  const anchorResponses = [
    "감사합니다. 자세한 사항은 공식 홈페이지를 확인해주시기 바랍니다.",
    "네, 알겠습니다. 학생 여러분께서는 게시판에서 상세 내용을 확인하실 수 있습니다.",
    "잘 들었습니다. 더 자세한 정보는 경희대학교 공지사항을 참고해주세요.",
    "알려주셔서 감사합니다. 관심 있는 분들은 공식 공지사항을 꼭 확인하시기 바랍니다.",
    "전해주셔서 고맙습니다. 자세한 내용은 학교 홈페이지에서 확인 가능합니다.",
  ];

  const anchorResponsesWithAttachments = [
    "네, 감사합니다. 첨부된 자료는 공식 게시판에서 다운로드하실 수 있습니다.",
    "알겠습니다. 관련 파일은 경희대학교 공지사항에서 확인하실 수 있어요.",
    "전해주셔서 고맙습니다. 자세한 자료는 게시판의 첨부 파일을 참고해주세요.",
    "네. 추가 자료가 필요하신 분들은 공식 홈페이지를 방문해주시기 바랍니다.",
    "잘 들었습니다. 청취자분들께서는 첨부 자료를 내려받아 자세히 확인하실 수 있습니다.",
  ];

  notices.forEach((notice, index) => {
    const noticeNum = index + 1;
    const featured = notice.featured ? "⭐ 주요 소식" : "";

    // Extract keywords from title - look for key terms
    const keywordPatterns = [
      /모집|공모|신청|모음/,
      /마감|기한|기간/,
      /행사|경진대회|대회|세미나|컨퍼런스/,
      /채용|채용공고/,
      /수강신청|수강|강좌/,
      /공지|공고/,
    ];

    let category = "공지사항";
    for (const pattern of keywordPatterns) {
      if (pattern.test(notice.title)) {
        if (pattern.source.includes("모집")) category = "모집";
        else if (pattern.source.includes("행사")) category = "행사";
        else if (pattern.source.includes("채용")) category = "채용";
        else if (pattern.source.includes("수강")) category = "수강신청";
        break;
      }
    }

    // Extract deadline if present
    const deadlineMatch = notice.title.match(/~?\s*(\d{1,2}[.\/]\d{1,2})/);

    const department = notice.department || notice.author || "경희대학교";
    const campus =
      notice.campus.replace(/캠퍼스/g, "").trim() ||
      "공통";
    
    // Select varied phrases
    const anchorIntro = anchorIntros[index % anchorIntros.length];
    const reporterStart = reporterStarts[index % reporterStarts.length];
    const categoryPhrase = (categoryPhrases[category] || categoryPhrases.default)[index % 4];
    const contentIntro = contentIntros[index % contentIntros.length];
    const contentOutro = contentOutros[index % contentOutros.length];
    const hasAttachments = notice.attachments > 0 || notice.images > 0;
    const anchorResponse = hasAttachments 
      ? anchorResponsesWithAttachments[index % anchorResponsesWithAttachments.length]
      : anchorResponses[index % anchorResponses.length];

    // Create natural sentence descriptions with variety
    let deadlineSentence = "";
    if (deadlineMatch) {
      const deadlineVariations = [
        `마감일은 ${deadlineMatch[1].replace(/\./g, "월 ")}일까지입니다.`,
        `${deadlineMatch[1].replace(/\./g, "월 ")}일까지 접수받습니다.`,
        `신청 기한은 ${deadlineMatch[1].replace(/\./g, "월 ")}일까지라고 합니다.`,
        `${deadlineMatch[1].replace(/\./g, "월 ")}일 마감이에요.`,
      ];
      deadlineSentence = deadlineVariations[index % deadlineVariations.length] + " ";
    }

    let mediaSentence = "";
    if (notice.attachments > 0 && notice.images > 0) {
      mediaSentence = `첨부 파일 ${notice.attachments}개와 이미지 ${notice.images}개가 함께 제공됩니다. `;
    } else if (notice.attachments > 0) {
      const fileVariations = [
        `${notice.attachments}개의 첨부 파일이 함께 제공됩니다.`,
        `관련 파일 ${notice.attachments}개를 다운로드하실 수 있습니다.`,
        `${notice.attachments}개 파일이 첨부되어 있습니다.`,
      ];
      mediaSentence = fileVariations[index % fileVariations.length] + " ";
    } else if (notice.images > 0) {
      mediaSentence = `이미지 ${notice.images}개가 포함되어 있습니다. `;
    }

    transcription += `## 세그먼트 ${noticeNum}: [${department}] ${notice.title}

${featured ? `${featured}\n\n` : ""}**앵커:**

${anchorIntro(notice.date, department, campus)}

**리포터:**

${reporterStart(department, notice.title)} ${categoryPhrase} ${deadlineSentence}

${
  notice.excerpt
    ? `${contentIntro} ${notice.excerpt}${notice.excerpt.length > 280 ? "..." : ""} ${contentOutro} `
    : `${department}에서 학생들을 위한 안내 사항을 게시했습니다. `
}${mediaSentence}

**앵커:**

${anchorResponse}

---

`;
  });

  transcription += `## [클로징]

**앵커:**

오늘 제${week}주차 경희대학교 주간 뉴스 방송을 마무리하겠습니다. 오늘은 총 ${totalNotices}건의 공지사항을 전해드렸습니다. 캠퍼스 운영, 채용 공고, 행사 안내 등 다양한 소식을 다루었는데요, 청취자 여러분께서는 경희대학교 공식 공지사항 게시판에서 더욱 자세한 내용을 확인하실 수 있습니다. 특히 마감일이 있는 공지사항의 경우 기한을 놓치지 않도록 주의해 주시기 바랍니다.

**리포터:**

청취해주신 모든 분들께 감사드립니다!

**앵커:**

지금까지 경희대학교 주간 뉴스 방송이었습니다. 다음 주에도 더 많은 유익한 소식으로 찾아뵙겠습니다. 모두 건강하시고 좋은 한 주 보내세요!

---

**방송 종료 - 주간 ${week}**

*생성됨: ${new Date().toISOString()}*
`;

  return transcription;
}

function main() {
  const noticesDir = path.join(__dirname, "..", "khu-notices-2026-07");
  const outputDir = noticesDir;

  // Find all week*.md files
  const weekFiles = fs
    .readdirSync(noticesDir)
    .filter(
      (file) =>
        file.match(/^week\d+\.md$/i) &&
        !file.includes("broadcast") &&
        !file.includes("transcription")
    )
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  console.log(`📻 Enhancing Korean broadcast transcriptions...\n`);
  console.log(`Found ${weekFiles.length} week files to process\n`);

  weekFiles.forEach((file) => {
    const filePath = path.join(noticesDir, file);
    const weekNum = file.match(/\d+/)?.[0] || "unknown";

    console.log(`🔄 Processing: ${file}`);

    try {
      const weekData = parseWeekMarkdownEnhanced(filePath);
      const transcription = generateKoreanTranscriptionEnhanced(weekData);

      const outputFile = path.join(
        outputDir,
        `week${weekNum}_broadcast_transcription_ko_enhanced.md`
      );
      fs.writeFileSync(outputFile, transcription, "utf-8");

      console.log(
        `✅ Generated: week${weekNum}_broadcast_transcription_ko_enhanced.md`
      );
      console.log(`   - ${weekData.notices.length} notices with enhanced descriptions\n`);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });

  console.log("✅ All enhanced Korean transcriptions generated successfully!");
  console.log(
    "\n📝 New files created with '_enhanced' suffix for comparison."
  );
}

main();
