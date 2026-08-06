'use client'

import { useEffect, useRef, useState } from 'react'
import { EPISODES, formatTime } from '../lib/utils'
import EpisodeList from './EpisodeList'
import ProgressBar from './ProgressBar'
import Controls from './Controls'
import VolumeControl from './VolumeControl'
import styles from './Player.module.css'

export default function Player() {
  const audioRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')
  const [volume, setVolume] = useState(70)

  const episode = EPISODES[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.src = episode.url
    audio.volume = volume / 100

    const updateTime = () => {
      setCurrentTime(formatTime(audio.currentTime))
      const progress = (audio.currentTime / audio.duration) * 100
    }

    const updateDuration = () => {
      setDuration(formatTime(audio.duration))
    }

    const handleEnded = () => {
      handleNext()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentIndex])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  function handlePlay() {
    const audio = audioRef.current
    if (audio.src === '') {
      audio.src = episode.url
    }

    if (audio.paused) {
      audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  function handlePrevious() {
    setCurrentIndex((prev) => (prev - 1 + EPISODES.length) % EPISODES.length)
    setIsPlaying(true)
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev + 1) % EPISODES.length)
    setIsPlaying(true)
  }

  function handleSeek(newTime) {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎙️ Podcast Player</h1>
        <p>Listen to your favorite podcasts</p>
      </header>

      <div className={styles.main}>
        <EpisodeList
          episodes={EPISODES}
          currentIndex={currentIndex}
          onSelect={(i) => {
            setCurrentIndex(i)
            setIsPlaying(true)
          }}
        />

        <div className={styles.player}>
          <div className={styles.nowPlaying}>
            <h3>{episode.title}</h3>
            <p>{episode.podcast}</p>
          </div>

          <ProgressBar
            current={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />

          <Controls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />

          <VolumeControl
            volume={volume}
            onVolumeChange={setVolume}
          />
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  )
}
