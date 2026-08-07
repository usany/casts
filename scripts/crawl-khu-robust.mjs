import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://www.khu.ac.kr/kor/user/bbs/BMSR00040'
const MENU_NO = process.argv[2] || '200316'
const OUT_DIR = process.argv[3] || join(__dirname, '..', 'khu-notices-2026-07')
const IMG_DIR = join(OUT_DIR, 'images')
const DOWNLOAD_IMAGES = false  // Set to false to skip image downloads
const BOARD_NAMES = { '200316': '일반', '200317': '학사', '200318': '장학' }
const BOARD_NAME = BOARD_NAMES[MENU_NO] || '공지사항'

const START = new Date('2026-06-29T00:00:00+09:00')
const END = new Date('2026-08-02T23:59:59+09:00')
const WEEK0_MON = new Date('2026-06-29T00:00:00+09:00')
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

async function downloadImage(url, filepath, ctx) {
  try {
    const imgPage = await ctx.newPage()
    const resp = await imgPage.goto(url, { waitUntil: 'load', timeout: 30000 })
    if (!resp || !resp.ok()) { 
      await imgPage.close()
      return false 
    }
    const buf = await resp.body()
    writeFileSync(filepath, buf)
    await imgPage.close()
    return true
  } catch {
    return false
  }
}

function imageLocalPath(boardId, idx, url) {
  const ext = url.match(/\.(jpg|jpeg|png|gif|bmp|webp)/i)?.[1] || 'jpg'
  return join(IMG_DIR, `${boardId}_${idx}.${ext}`)
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ locale: 'ko-KR' })
const page = await ctx.newPage()

async function crawlList() {
  const items = []
  let pageIndex = 1
  let emptyPages = 0

  while (pageIndex <= 50) {
    try {
      await page.goto(
        `${BASE}/list.do?menuNo=${MENU_NO}&pageIndex=${pageIndex}`,
        { waitUntil: 'domcontentloaded', timeout: 30000 }
      )
      await page.waitForSelector('table.board01 tbody tr', { timeout: 10000 })

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
    } catch (err) {
      console.error(`⚠️  Error on page ${pageIndex}:`, err.message)
      emptyPages++
      if (emptyPages >= 3) break
      pageIndex++
      await sleep(1000)
    }
  }

  return items
}

async function crawlDetail(item, ctx) {
  try {
    const detailPage = await ctx.newPage()
    await detailPage.goto(
      `${BASE}/view.do?menuNo=${MENU_NO}&boardId=${item.boardId}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    )
    
    // Wait for content, but don't fail if it doesn't exist
    try {
      await detailPage.waitForSelector('.board02', { timeout: 5000 })
    } catch {
      await detailPage.close()
      return item
    }

    const detail = await detailPage.evaluate(() => {
      const board = document.querySelector('.board02')
      if (!board) return {}

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

    const localImages = []
    if (DOWNLOAD_IMAGES) {
      for (let i = 0; i < detail.images.length; i++) {
        const url = detail.images[i]
        const localPath = imageLocalPath(item.boardId, i, url)
        const ok = await downloadImage(url, localPath, ctx)
        if (ok) localImages.push(localPath)
      }
    }
    detail.localImages = localImages

    await detailPage.close()
    await sleep(200)
    return { ...item, ...detail }
  } catch (err) {
    console.error(`⚠️  Error crawling detail for ${item.boardId}:`, err.message)
    return item
  }
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
  const r = await crawlDetail(unique[i], ctx)
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
if (DOWNLOAD_IMAGES) mkdirSync(IMG_DIR, { recursive: true })

for (const w of [1, 2, 3, 4, 5]) {
  const list = byWeek[w]
  const lines = []
  lines.push(`# Kyung Hee University - Notices (${BOARD_NAME})`)
  lines.push(``)
  lines.push(`## July 2026 - ${weekLabel(w)}`)
  lines.push(``)
  lines.push(`- **Board**: 공지사항 > ${BOARD_NAME}`)
  lines.push(`- **Source**: https://www.khu.ac.kr/kor/user/bbs/BMSR00040/list.do?menuNo=${MENU_NO}`)
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
    meta.push(`[Original](https://www.khu.ac.kr/kor/user/bbs/BMSR00040/view.do?menuNo=${MENU_NO}&boardId=${it.boardId})`)
    lines.push(`> ${meta.join(' | ')}`)
    lines.push(``)
    if (it.contentText) {
      lines.push(it.contentText)
      lines.push(``)
    }
    if (it.localImages && it.localImages.length) {
      lines.push(`**Content Images:**`)
      for (const img of it.localImages) {
        const rel = img.replace(OUT_DIR + '\\', '').replace(OUT_DIR + '/', '')
        lines.push(`- ![${it.title}](${rel})`)
      }
      lines.push(``)
    } else if (it.images.length) {
      lines.push(`**Images (remote):**`)
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

const manifest = results.map((r) => ({
  boardId: r.boardId,
  title: r.title,
  date: r.date,
  author: r.author,
  campus: r.campus,
  contentText: r.contentText,
  localImages: r.localImages || [],
  images: r.images,
  attachments: r.attachments,
}))
writeFileSync(join(OUT_DIR, '_raw.json'), JSON.stringify(results, null, 2), 'utf8')
writeFileSync(join(OUT_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

const imgCount = results.reduce((s, r) => s + (r.localImages?.length || 0), 0)
console.log(`Done. ${results.length} notices, ${imgCount} images downloaded.`)
