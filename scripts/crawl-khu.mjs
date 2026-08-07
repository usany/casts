import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://www.khu.ac.kr/kor/user/bbs/BMSR00040'
const MENU_NO = '200317'
const OUT_DIR = join(__dirname, '..', 'khu-notices-2026-07')

const START = new Date('2026-06-29T00:00:00+09:00')
const END = new Date('2026-08-02T23:59:59+09:00')
const WEEK0_MON = new Date('2026-06-29T00:00:00+09:00') // Monday on or before Jul 1, 2026
const DAY_MS = 86400000

function weekNumber(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+09:00`)
  const w = Math.floor((d - WEEK0_MON) / DAY_MS / 7) + 1
  return Math.min(5, Math.max(1, w))
}

function weekLabel(w) {
  const start = new Date(WEEK0_MON.getTime() + (w - 1) * 7 * DAY_MS)
  const end = new Date(start.getTime() + 6 * DAY_MS)
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  return `Week ${w} (${fmt(start)} ~ ${fmt(end)})`
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ locale: 'ko-KR' })
const page = await ctx.newPage()

async function crawlList() {
  const items = []
  let pageIndex = 1
  let emptyPages = 0

  while (pageIndex <= 50) {
    await page.goto(
      `${BASE}/list.do?menuNo=${MENU_NO}&pageIndex=${pageIndex}`,
      { waitUntil: 'domcontentloaded' }
    )
    await page.waitForSelector('table.board01 tbody tr')

    const rows = await page.$$eval('table.board01 tbody tr', (trs) =>
      trs.map((tr) => {
        const tds = tr.querySelectorAll('td')
        const link = tr.querySelector('td.tal a[href*="view("]')
        const href = link ? link.getAttribute('href') : ''
        const idMatch = href.match(/view\('(\d+)'/)
        const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
        const campus =
          tr.querySelector('.txtBox01')?.textContent.trim() || ''
        const title = txt(link)
          .replace(campus, '')
          .replace(/^\s*\[\w+\]\s*/, '')
          .trim()
        return {
          boardId: idMatch ? idMatch[1] : null,
          category: txt(tds[0]),
          campus,
          title,
          author: txt(tds[2]),
          date: txt(tds[3]),
          hits: txt(tds[4]),
        }
      })
    )

    const inRange = rows.filter((r) => {
      if (!r.date) return false
      const d = new Date(`${r.date}T00:00:00+09:00`)
      return !isNaN(d) && d >= START && d <= END
    })
    items.push(...inRange)

    const maxDate = rows
      .map((r) => new Date(`${r.date}T00:00:00+09:00`).getTime())
      .filter((t) => !isNaN(t))
    const pageMax = maxDate.length ? Math.max(...maxDate) : 0

    console.log(
      `page ${pageIndex}: ${inRange.length} in range (page max ${new Date(
        pageMax
      ).toISOString().slice(0, 10)})`
    )

    if (rows.length === 0 || pageMax < START.getTime()) {
      emptyPages++
      if (emptyPages >= 2) break
    } else {
      emptyPages = 0
    }

    pageIndex++
    await sleep(300)
  }

  return items
}

async function crawlDetail(item) {
  await page.goto(
    `${BASE}/view.do?menuNo=${MENU_NO}&boardId=${item.boardId}`,
    { waitUntil: 'domcontentloaded' }
  )
  await page.waitForSelector('.board02')

  const detail = await page.evaluate(() => {
    const board = document.querySelector('.board02')
    const q = (sel) => board.querySelector(sel)
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')

    const titleEl = q('.row .tit p.txt06')
    const contentEl = q('.row.contents')

    const images = contentEl
      ? [...contentEl.querySelectorAll('img')].map((img) => img.src)
      : []

    const attachments = [
      ...board.querySelectorAll('.row.addFile a'),
    ].map((a) => ({
      name: txt(a.querySelector('.txt06')) || txt(a),
      href: a.href,
    }))

    return {
      title: txt(titleEl),
      date: txt(q('.dateBox .date')),
      hits: txt(q('.dateBox .hits')),
      author: txt(q('.tit.txtWriter')),
      contentText: contentEl ? contentEl.innerText.trim() : '',
      contentHtml: contentEl ? contentEl.innerHTML : '',
      images,
      attachments,
    }
  })

  await sleep(200)
  return { ...item, ...detail }
}

console.log('Crawling list pages...')
const items = await crawlList()
console.log(`Collected ${items.length} notices in range`)

const seen = new Set()
const unique = items.filter((i) => {
  if (seen.has(i.boardId)) return false
  seen.add(i.boardId)
  return true
})

console.log('Crawling detail pages...')
const results = []
for (let i = 0; i < unique.length; i++) {
  const r = await crawlDetail(unique[i])
  results.push(r)
  console.log(`  [${i + 1}/${unique.length}] ${r.date} - ${r.title}`)
}

await browser.close()

const byWeek = { 1: [], 2: [], 3: [], 4: [], 5: [] }
for (const r of results) byWeek[weekNumber(r.date)].push(r)
for (const w of [1, 2, 3, 4, 5]) {
  byWeek[w].sort((a, b) => a.date.localeCompare(b.date))
}

mkdirSync(OUT_DIR, { recursive: true })

for (const w of [1, 2, 3, 4, 5]) {
  const list = byWeek[w]
  const lines = []
  lines.push(`# Kyung Hee University - Academic Notices (학사)`)
  lines.push(``)
  lines.push(`## July 2026 - ${weekLabel(w)}`)
  lines.push(``)
  lines.push(`- **Board**: 공지사항 > 학사`)
  lines.push(`- **Source**: https://www.khu.ac.kr/kor/user/bbs/BMSR00040/list.do?menuNo=200317`)
  lines.push(`- **Notices**: ${list.length}`)
  lines.push(``)

  for (const it of list) {
    lines.push(`---`)
    lines.push(``)
    lines.push(`### ${it.title}`)
    lines.push(``)
    const meta = []
    if (it.campus) meta.push(`Campus: ${it.campus}`)
    meta.push(`Date: ${it.date}`)
    if (it.author) meta.push(`Author: ${it.author}`)
    if (it.hits) meta.push(it.hits)
    meta.push(`[Original](https://www.khu.ac.kr/kor/user/bbs/BMSR00040/view.do?menuNo=200317&boardId=${it.boardId})`)
    lines.push(`> ${meta.join(' | ')}`)
    lines.push(``)
    if (it.contentText) {
      lines.push(it.contentText)
      lines.push(``)
    }
    if (it.images.length) {
      lines.push(`**Images:**`)
      for (const src of it.images) lines.push(`- ${src}`)
      lines.push(``)
    }
    if (it.attachments.length) {
      lines.push(`**Attachments:**`)
      for (const a of it.attachments) {
        lines.push(`- [${a.name || 'file'}](${a.href})`)
      }
      lines.push(``)
    }
  }

  const file = join(OUT_DIR, `week${w}.md`)
  writeFileSync(file, lines.join('\n'), 'utf8')
  console.log(`Wrote ${file} (${list.length} notices)`)
}

writeFileSync(
  join(OUT_DIR, '_raw.json'),
  JSON.stringify(results, null, 2),
  'utf8'
)
console.log('Done.')
