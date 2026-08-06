'use client'

import styles from './Controls.module.css'

export default function Controls({ isPlaying, onPlay, onPrevious, onNext }) {
  return (
    <div className={styles.controls}>
      <button className={styles.smallBtn} onClick={onPrevious}>
        ⏮ Prev
      </button>
      <button className={styles.playBtn} onClick={onPlay}>
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
      <button className={styles.smallBtn} onClick={onNext}>
        Next ⏭
      </button>
    </div>
  )
}
