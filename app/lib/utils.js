export const EPISODES = [
  { title: "Newsfront", podcast: "News Podcast", duration: "0:00", url: "/Newsfront.mp3" },
]

export function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
