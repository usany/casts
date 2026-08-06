'use client'

import styles from './EpisodeList.module.css'

export default function EpisodeList({ episodes, currentIndex, onSelect }) {
  return (
    <div className={styles.container}>
      <h2>Episodes</h2>
      <div className={styles.list}>
        {episodes.map((ep, i) => (
          <div
            key={i}
            className={`${styles.item} ${i === currentIndex ? styles.active : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className={styles.title}>{ep.title}</div>
            <div className={styles.podcast}>{ep.podcast}</div>
            <div className={styles.duration}>⏱ {ep.duration}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
