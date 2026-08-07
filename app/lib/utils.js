export const EPISODES = [
  { title: "Newsfront", podcast: "News Podcast", duration: "1:00", url: "/Newsfront.mp3" },
  { title: "KHU Weekly News Broadcast - Week 5", podcast: "KHU News", duration: "2:37", url: "/week5_broadcast_audio.wav" },
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
