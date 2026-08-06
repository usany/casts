'use client'

import styles from './ProgressBar.module.css'

export default function ProgressBar({ current, duration, onSeek }) {
  function handleSeek(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    onSeek(newTime)
  }

  const progress = duration ? (current / duration) * 100 : 0

  return (
    <div className={styles.container}>
      <div className={styles.bar} onClick={handleSeek}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.times}>
        <span>{current}</span>
        <span>{duration}</span>
      </div>
    </div>
  )
}
