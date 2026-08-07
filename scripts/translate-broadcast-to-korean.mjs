import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Translation rules - applied in order
const translationRules = [
  // Exact phrase translations (must be exact match)
  {
    pattern: "Good morning, everyone! This is the KHU Weekly News Broadcast. I'm your anchor, bringing you the most important updates from Kyung Hee University this week.",
    replacement: "안녕하세요, 여러분! 경희대학교 주간 뉴스 방송입니다. 저는 앵커로서 이번 주 경희대학교의 가장 중요한 소식들을 전해드립니다."
  },
  {
    pattern: "We have",
    replacement: "이번에는"
  },
  {
    pattern: "notices to cover, spanning announcements from various departments and campus facilities. Let's dive right in!",
    replacement: "개의 공지사항이 있으며, 다양한 부서와 캠퍼스 시설의 공지사항을 다룹니다. 시작하겠습니다!"
  },
  {
    pattern: "Next up, we have an important announcement dated",
    replacement: "다음은 날짜의 중요한 공지사항입니다"
  },
  {
    pattern: "This comes from",
    replacement: "이것은 다음에서 나온 것입니다:"
  },
  {
    pattern: "at our",
    replacement: "우리의"
  },
  {
    pattern: "campus. Reporter",
    replacement: "캠퍼스의 리포터"
  },
  {
    pattern: "could you brief us on this?",
    replacement: "이것에 대해 설명해주시겠어요?"
  },
  {
    pattern: "Of course!",
    replacement: "물론이죠!"
  },
  {
    pattern: "The notice states:",
    replacement: "공지사항의 내용:"
  },
  {
    pattern: "This is an important update from",
    replacement: "이것은의 중요한 업데이트입니다"
  },
  {
    pattern: "Additional materials:",
    replacement: "추가 자료:"
  },
  {
    pattern: "Thank you for that update.",
    replacement: "좋은 정보 감사합니다."
  },
  {
    pattern: "Our viewers can find",
    replacement: "시청자들은"
  },
  {
    pattern: "attachment(s) with this notice for more details.",
    replacement: "개의 첨부 자료로 더 자세한 내용을 확인할 수 있습니다."
  },
  {
    pattern: "That wraps up our Week",
    replacement: "제"
  },
  {
    pattern: "news broadcast for KHU. We covered",
    replacement: "주간의 뉴스 방송을 마치겠습니다. 저희는"
  },
  {
    pattern: "important announcements spanning campus operations, recruitment drives, competitions, and more.",
    replacement: "캠퍼스 운영, 채용 공고, 경쟁 및 기타 중요한 공지사항들을 다루었습니다."
  },
  {
    pattern: "Remember to check the full details on the official KHU notice board, and don't miss any deadlines mentioned in these announcements!",
    replacement: "경희대학교 공식 공지사항 게시판에서 전체 내용을 확인하시고, 공지사항에 언급된 마감일을 놓치지 마세요!"
  },
  {
    pattern: "REPORTERS:",
    replacement: "리포터들:"
  },
  {
    pattern: "Thank you for tuning in!",
    replacement: "청취해주셔서 감사합니다!"
  },
  {
    pattern: "This has been the KHU Weekly News Broadcast. We'll be back next week with more updates. Have a great week!",
    replacement: "이상 경희대학교 주간 뉴스 방송이었습니다. 다음 주에 더 많은 소식으로 찾아뵙겠습니다. 좋은 한 주 되세요!"
  },
  {
    pattern: "End of Broadcast - Week",
    replacement: "방송 종료 - 주간"
  },
  // Short word replacements
  {
    pattern: "SEGMENT",
    replacement: "세그먼트"
  },
  {
    pattern: "FEATURED",
    replacement: "주요"
  },
  {
    pattern: "Broadcast Date",
    replacement: "방송 날짜"
  },
  {
    pattern: "Total Notices",
    replacement: "총 공지사항"
  },
  {
    pattern: "OPENING",
    replacement: "오프닝"
  },
  {
    pattern: "CLOSING",
    replacement: "클로징"
  },
  {
    pattern: "KHU NEWS BROADCAST TRANSCRIPTION",
    replacement: "경희대 뉴스 방송 기록"
  },
  {
    pattern: "Anchor & Reporter Dialogue",
    replacement: "앵커 & 리포터 대화"
  },
  {
    pattern: "ANCHOR:",
    replacement: "앵커:"
  },
  {
    pattern: "REPORTER",
    replacement: "리포터"
  },
  {
    pattern: "Generated:",
    replacement: "생성됨:"
  }
];

function translateContent(content) {
  let result = content;
  
  // Apply all translation rules
  for (const rule of translationRules) {
    result = result.replace(new RegExp(rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), rule.replacement);
  }
  
  return result;
}

function main() {
  const noticesDir = path.join(__dirname, "..", "khu-notices-2026-07");
  const outputDir = noticesDir;

  // Find all week*_broadcast_transcription.md files (excluding _ko versions)
  const transcriptionFiles = fs
    .readdirSync(noticesDir)
    .filter((file) => file.match(/^week\d+_broadcast_transcription\.md$/) && 
                      !file.includes('_ko'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  console.log(`📡 Starting broadcast transcription translation to Korean\n`);
  console.log(`Found ${transcriptionFiles.length} broadcast files\n`);

  if (transcriptionFiles.length === 0) {
    console.log("⚠️  No broadcast transcription files found.");
    console.log("First, run: npm run generate:broadcast-transcriptions");
    return;
  }

  let successCount = 0;
  const results = [];

  transcriptionFiles.forEach((file) => {
    const filePath = path.join(noticesDir, file);
    const weekNum = file.match(/\d+/)?.[0] || "unknown";
    const outputFile = filePath.replace('.md', '_ko.md');

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const translated = translateContent(content);

      fs.writeFileSync(outputFile, translated, "utf-8");

      results.push({
        week: weekNum,
        status: "✓",
        file: `week${weekNum}_broadcast_transcription_ko.md`
      });
      
      console.log(`✓ week${weekNum}: Translated successfully`);
      successCount++;
    } catch (error) {
      results.push({
        week: weekNum,
        status: "✗",
        error: error.message
      });
      console.log(`✗ week${weekNum}: ${error.message}`);
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ Translation Complete: ${successCount}/${transcriptionFiles.length} files`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  if (successCount > 0) {
    console.log(`📁 Korean-translated files ready in khu-notices-2026-07/:\n`);
    results.filter(r => r.status === "✓").forEach((r) => {
      console.log(`   📄 ${r.file}`);
    });
    console.log(`\n💡 Ready for broadcast! Files can be used for:`);
    console.log(`   • Audio/video conversion (text-to-speech)`);
    console.log(`   • Korean news broadcast production`);
    console.log(`   • Content distribution to Korean-speaking audience`);
  }
}

main();
