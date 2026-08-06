export const EPISODES = [
  { title: "Episode 1: Getting Started", podcast: "Tech Talk Daily", duration: "18:42", url: "https://www.soundhelix.com/sounds/mp3/SoundHelix-Song-1.mp3" },
  { title: "Episode 2: Advanced Topics", podcast: "Tech Talk Daily", duration: "25:15", url: "https://www.soundhelix.com/sounds/mp3/SoundHelix-Song-2.mp3" },
  { title: "Episode 3: Q&A Session", podcast: "Tech Talk Daily", duration: "22:30", url: "https://www.soundhelix.com/sounds/mp3/SoundHelix-Song-3.mp3" },
  { title: "Episode 1: Introduction", podcast: "Code Weekly", duration: "15:45", url: "https://www.soundhelix.com/sounds/mp3/SoundHelix-Song-4.mp3" },
  { title: "Episode 2: Best Practices", podcast: "Code Weekly", duration: "29:10", url: "https://www.soundhelix.com/sounds/mp3/SoundHelix-Song-5.mp3" },
]

export function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
