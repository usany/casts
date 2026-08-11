export const EPISODES = [
  { title: "2026-07-27 Week 3 Radio News", podcast: "KHU Radio News", duration: "6:08", url: "/news/2026-07-27-week3.wav" },
  { title: "2026-08-08 Week 1 Radio News", podcast: "KHU Radio News", duration: "10:10", url: "/news/2026-08-08-week1.wav" },
  { title: "Newsfront", podcast: "News Podcast", duration: "0:00", url: "/Newsfront.mp3" },
]

export async function getAudioDuration(url) {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.onloadedmetadata = () => {
      resolve(formatTime(audio.duration))
    }
    audio.onerror = () => {
      resolve('0:00')
    }
    audio.src = url
  })
}

export function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
