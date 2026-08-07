import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface NewsItem {
  title: string;
  date: string;
  link: string;
  content?: string;
}

interface WeeklyNews {
  week: number;
  items: NewsItem[];
}

const BASE_URL = 'https://www.khu.ac.kr/kor/user/bbs/BMSR00040/list.do';
const MENU_NO = '200316';
const OUTPUT_DIR = path.join(process.cwd(), 'khu-notices-2026-07');

async function crawlPage(pageIndex: number): Promise<NewsItem[]> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const url = `${BASE_URL}?menuNo=${MENU_NO}&pageIndex=${pageIndex}`;
    console.log(`\n🔄 Crawling page ${pageIndex}: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Extract news items
    const items = await page.evaluate(() => {
      const results: NewsItem[] = [];
      const rows = document.querySelectorAll('tbody tr');

      rows.forEach((row) => {
        const titleElement = row.querySelector('a');
        const dateElement = row.querySelector('td:nth-child(3)');

        if (titleElement && dateElement) {
          const title = titleElement.textContent?.trim() || '';
          const date = dateElement.textContent?.trim() || '';
          const link = titleElement.getAttribute('href') || '';

          if (title && date) {
            results.push({
              title,
              date,
              link: link.startsWith('http')
                ? link
                : `https://www.khu.ac.kr${link}`,
            });
          }
        }
      });

      return results;
    });

    console.log(`✅ Found ${items.length} items on page ${pageIndex}`);
    return items;
  } catch (error) {
    console.error(`❌ Error crawling page ${pageIndex}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

function categorizeByWeek(items: NewsItem[]): WeeklyNews[] {
  const weeklyData: Map<number, NewsItem[]> = new Map();

  // Initialize weeks 1-5
  for (let i = 1; i <= 5; i++) {
    weeklyData.set(i, []);
  }

  items.forEach((item) => {
    // Parse date and determine week
    const dateMatch = item.date.match(/2026-07-(\d{2})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      let week = Math.ceil(day / 7);
      
      // Ensure week is within 1-5 range
      if (week > 5) week = 5;
      if (week < 1) week = 1;

      const weekItems = weeklyData.get(week) || [];
      weekItems.push(item);
      weeklyData.set(week, weekItems);
    }
  });

  const result: WeeklyNews[] = [];
  for (let week = 1; week <= 5; week++) {
    const items = weeklyData.get(week) || [];
    if (items.length > 0) {
      result.push({ week, items });
    }
  }

  return result;
}

function generateNewsBroadcast(weeklyNews: WeeklyNews[]): string {
  let broadcast = `
╔════════════════════════════════════════════════════════════╗
║         🎙️  KHU NEWS BROADCAST - JULY 2026  🎙️            ║
║                Weekly News Summary                          ║
╚════════════════════════════════════════════════════════════╝
`;

  weeklyNews.forEach((week) => {
    broadcast += `\n${'═'.repeat(60)}\n`;
    broadcast += `📅 WEEK ${week.week} (July ${(week.week - 1) * 7 + 1} - ${week.week * 7})\n`;
    broadcast += `${'═'.repeat(60)}\n\n`;

    week.items.forEach((item, index) => {
      broadcast += `${index + 1}. [${item.date}] ${item.title}\n`;
      broadcast += `   📌 ${item.link}\n\n`;
    });
  });

  broadcast += `\n${'═'.repeat(60)}\n`;
  broadcast += `Generated: ${new Date().toLocaleString('ko-KR')}\n`;
  broadcast += `${'═'.repeat(60)}\n`;

  return broadcast;
}

async function main() {
  console.log('🚀 Starting KHU News Crawler...\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let allItems: NewsItem[] = [];
  let pageIndex = 1;
  const maxPages = 10; // Safety limit to avoid infinite loops

  // Crawl multiple pages to collect July 2026 data
  while (pageIndex <= maxPages) {
    const items = await crawlPage(pageIndex);

    if (items.length === 0) {
      console.log(`\n⏹️  No more items found. Stopping crawl.`);
      break;
    }

    // Filter for July 2026 items
    const julyItems = items.filter((item) => item.date.includes('2026-07'));

    if (julyItems.length > 0) {
      allItems = [...allItems, ...julyItems];
      pageIndex++;
    } else {
      // If no July items on this page, we've likely passed July
      console.log(`\n⏹️  No July 2026 items found. Stopping crawl.`);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
  }

  console.log(`\n📊 Total items collected: ${allItems.length}\n`);

  if (allItems.length > 0) {
    // Categorize by week
    const weeklyNews = categorizeByWeek(allItems);

    // Generate news broadcast
    const broadcast = generateNewsBroadcast(weeklyNews);

    // Save to file
    const outputFile = path.join(OUTPUT_DIR, 'news-broadcast.txt');
    fs.writeFileSync(outputFile, broadcast);
    console.log(`✅ News broadcast saved to: ${outputFile}`);

    // Also save JSON data
    const jsonFile = path.join(OUTPUT_DIR, 'weekly-news.json');
    fs.writeFileSync(jsonFile, JSON.stringify(weeklyNews, null, 2));
    console.log(`✅ JSON data saved to: ${jsonFile}`);

    // Print to console
    console.log(broadcast);
  } else {
    console.log('⚠️  No July 2026 items found.');
  }
}

main().catch(console.error);
