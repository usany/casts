import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'khu-notices-2026-07')

const WEEK_LABELS = {
  1: 'June 29 - July 5',
  2: 'July 6 - July 12',
  3: 'July 13 - July 19',
  4: 'July 20 - July 26',
  5: 'July 27 - August 2',
}

function generateNewsBroadcast() {
  console.log('📰 Generating News Broadcast...\n')

  let broadcast = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║          🎙️  KHU NEWS BROADCAST - JULY 2026  🎙️                ║
║                    Weekly News Summary                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
\n`

  // Load manifest data
  let manifest = []
  try {
    const manifestData = readFileSync(join(OUT_DIR, '_manifest.json'), 'utf8')
    manifest = JSON.parse(manifestData)
  } catch (err) {
    console.error('❌ Could not load _manifest.json')
    return
  }

  // Group by week
  const DAY_MS = 86400000
  const WEEK0_MON = new Date('2026-06-29T00:00:00+09:00')

  function getWeek(dateStr) {
    const d = new Date(`${dateStr}T00:00:00+09:00`)
    const w = Math.floor((d - WEEK0_MON) / DAY_MS / 7) + 1
    return Math.min(5, Math.max(1, w))
  }

  const byWeek = { 1: [], 2: [], 3: [], 4: [], 5: [] }
  for (const item of manifest) {
    const w = getWeek(item.date)
    byWeek[w].push(item)
  }

  // Sort each week by date
  for (const w of [1, 2, 3, 4, 5]) {
    byWeek[w].sort((a, b) => a.date.localeCompare(b.date))
  }

  // Generate broadcast for each week
  for (const w of [1, 2, 3, 4, 5]) {
    const items = byWeek[w]
    if (items.length === 0) continue

    broadcast += `${'═'.repeat(66)}\n`
    broadcast += `📅 WEEK ${w}: ${WEEK_LABELS[w]}\n`
    broadcast += `${'═'.repeat(66)}\n\n`

    broadcast += `📊 Total Notices: ${items.length}\n\n`

    items.forEach((item, idx) => {
      broadcast += `${String(idx + 1).padStart(2, ' ')}. ` + 
                  `[${item.date}] ${item.title}\n`
      
      if (item.campus) {
        broadcast += `    📍 Campus: ${item.campus}\n`
      }
      
      if (item.author) {
        broadcast += `    ✍️  Author: ${item.author}\n`
      }

      // Add brief content preview
      if (item.contentText) {
        const preview = item.contentText
          .split('\n')[0]
          .substring(0, 80)
          .trim()
        if (preview.length > 10) {
          broadcast += `    📝 ${preview}...\n`
        }
      }

      if (item.localImages && item.localImages.length > 0) {
        broadcast += `    🖼️  ${item.localImages.length} image(s)\n`
      }

      if (item.attachments && item.attachments.length > 0) {
        broadcast += `    📎 ${item.attachments.length} attachment(s)\n`
      }

      broadcast += `\n`
    })

    broadcast += `\n`
  }

  broadcast += `${'═'.repeat(66)}\n`
  broadcast += `📊 SUMMARY\n`
  broadcast += `${'═'.repeat(66)}\n\n`

  let totalNotices = 0
  for (const w of [1, 2, 3, 4, 5]) {
    const count = byWeek[w].length
    if (count > 0) {
      broadcast += `Week ${w}: ${count} notice${count !== 1 ? 's' : ''}\n`
      totalNotices += count
    }
  }

  broadcast += `\nTotal: ${totalNotices} notice${totalNotices !== 1 ? 's' : ''}\n\n`
  broadcast += `Generated: ${new Date().toLocaleString('en-US', { 
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}\n`
  broadcast += `Source: https://www.khu.ac.kr/kor/user/bbs/BMSR00040/list.do?menuNo=200316\n`
  broadcast += `${'═'.repeat(66)}\n`

  return broadcast
}

const broadcast = generateNewsBroadcast()
if (broadcast) {
  const outputFile = join(OUT_DIR, 'NEWS_BROADCAST.txt')
  writeFileSync(outputFile, broadcast, 'utf8')
  console.log(`✅ News broadcast saved to: ${outputFile}`)
  console.log(broadcast)
}
