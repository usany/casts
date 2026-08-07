import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseWeekMarkdown(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let week = 0;
  let dateRange = "";
  let totalNotices = 0;
  const notices = [];

  let currentNotice = null;
  let excerptStarted = false;

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
      };
      excerptStarted = false;

      // Look ahead for metadata line (starts with ">")
      if (i + 1 < lines.length && lines[i + 1].startsWith(">")) {
        const metaLine = lines[i + 1];
        // Parse: > Campus: xxx | Date: xxx | Author: xxx | ...

        const campusMatch = metaLine.match(/Campus:\s*([^|]+)/);
        if (campusMatch) currentNotice.campus = campusMatch[1].trim();

        const dateMatch = metaLine.match(/Date:\s*([\d-]+)/);
        if (dateMatch) currentNotice.date = dateMatch[1].trim();

        const authorMatch = metaLine.match(/Author:\s*([^|]+)/);
        if (authorMatch) currentNotice.author = authorMatch[1].trim();
      }
    } else if (line.startsWith(">") && currentNotice && !currentNotice.date) {
      // Parse metadata line
      const campusMatch = line.match(/Campus:\s*([^|]+)/);
      if (campusMatch) currentNotice.campus = campusMatch[1].trim();

      const dateMatch = line.match(/Date:\s*([\d-]+)/);
      if (dateMatch) currentNotice.date = dateMatch[1].trim();

      const authorMatch = line.match(/Author:\s*([^|]+)/);
      if (authorMatch) currentNotice.author = authorMatch[1].trim();
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
      !excerptStarted &&
      line.trim() &&
      !line.startsWith("#") &&
      !line.startsWith(">") &&
      !line.startsWith("**") &&
      !line.startsWith("-") &&
      line.length > 20
    ) {
      currentNotice.excerpt = line.substring(0, 150).trim();
      excerptStarted = true;
    }
  }

  if (currentNotice && currentNotice.title) {
    notices.push(currentNotice);
  }

  return { week, dateRange, totalNotices, notices };
}

function generateTranscription(weekData) {
  const { week, dateRange, totalNotices, notices } = weekData;

  let transcription = `# 📻 KHU NEWS BROADCAST TRANSCRIPTION - WEEK ${week}

> Anchor & Reporter Dialogue

**📅 Broadcast Date:** ${dateRange}  
**📊 Total Notices:** ${totalNotices}

---

## [OPENING]

**ANCHOR:**

Good morning, everyone! This is the KHU Weekly News Broadcast. I'm your anchor, bringing you the most important updates from Kyung Hee University this week.

We have ${totalNotices} notices to cover, spanning announcements from various departments and campus facilities. Let's dive right in!

---

`;

  notices.forEach((notice, index) => {
    const noticeNum = index + 1;
    const featured = notice.featured ? "⭐ FEATURED" : "";
    const hasMedia =
      notice.attachments > 0 || notice.images > 0
        ? `📎 ${notice.attachments} files • 🖼️ ${notice.images} images`
        : "";

    transcription += `## SEGMENT ${noticeNum}: ${notice.title}

${featured}

**ANCHOR:**

Next up, we have an important announcement dated ${notice.date}. This comes from ${notice.author} at our ${notice.campus} campus. Reporter ${index + 1}, could you brief us on this?

**REPORTER ${index + 1}:**

Of course! "${notice.title}"

${
  notice.excerpt
    ? `The notice states: "${notice.excerpt}${notice.excerpt.length > 140 ? "..." : ""}"`
    : `This is an important update from ${notice.author}`
}

${hasMedia ? `Additional materials: ${hasMedia}` : ""}

**ANCHOR:**

Thank you for that update. ${
      notice.attachments > 0
        ? `Our viewers can find ${notice.attachments} attachment(s) with this notice for more details.`
        : ``
    }

---

`;
  });

  transcription += `## [CLOSING]

**ANCHOR:**

That wraps up our Week ${week} news broadcast for KHU. We covered ${totalNotices} important announcements spanning campus operations, recruitment drives, competitions, and more.

Remember to check the full details on the official KHU notice board, and don't miss any deadlines mentioned in these announcements!

**REPORTERS:**

Thank you for tuning in!

**ANCHOR:**

This has been the KHU Weekly News Broadcast. We'll be back next week with more updates. Have a great week!

---

**End of Broadcast - Week ${week}**

*Generated: ${new Date().toISOString()}*
`;

  return transcription;
}

function main() {
  const noticesDir = path.join(__dirname, "..", "khu-notices-2026-07");
  const outputDir = noticesDir;

  // Find all week*.md files
  const weekFiles = fs
    .readdirSync(noticesDir)
    .filter((file) => file.match(/^week\d+\.md$/i))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  console.log(`Found ${weekFiles.length} week files to process\n`);

  weekFiles.forEach((file) => {
    const filePath = path.join(noticesDir, file);
    const weekNum = file.match(/\d+/)?.[0] || "unknown";

    console.log(`Processing: ${file}`);

    try {
      const weekData = parseWeekMarkdown(filePath);
      const transcription = generateTranscription(weekData);

      const outputFile = path.join(
        outputDir,
        `week${weekNum}_broadcast_transcription.md`
      );
      fs.writeFileSync(outputFile, transcription, "utf-8");

      console.log(`✓ Generated: week${weekNum}_broadcast_transcription.md`);
      console.log(`  - ${weekData.notices.length} notices processed\n`);
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error);
    }
  });

  console.log("✓ All transcriptions generated successfully!");
}

main();
