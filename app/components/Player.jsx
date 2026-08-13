'use client'

import { useEffect, useRef, useState } from 'react'
import { EPISODES, formatTime } from '../lib/utils'
import { useTheme } from '../lib/ThemeContext'
import { getTranslation } from '../lib/i18n'
import EpisodeList from './EpisodeList'
import WaveformProgress from './WaveformProgress'
import Controls from './Controls'
import VolumeControl from './VolumeControl'
import DetailDropdown from './DetailDropdown'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'
import styles from './Player.module.css'

export default function Player() {
  const audioRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0)
  const [duration, setDuration] = useState('0:00')
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [volume, setVolume] = useState(70)
  const { language } = useTheme()

  const episode = EPISODES[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.src = episode.url
    audio.volume = volume / 100

    const updateTime = () => {
      setCurrentTime(formatTime(audio.currentTime))
      setCurrentTimeSeconds(audio.currentTime)
    }

    const updateDuration = () => {
      setDuration(formatTime(audio.duration))
      setDurationSeconds(audio.duration)
    }

    const handleEnded = () => {
      setCurrentIndex((prev) => (prev + 1) % EPISODES.length)
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
    const audio = audioRef.current
    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }

  function handleNext() {
    const audio = audioRef.current
    audio.currentTime = Math.min(
      audio.duration || Infinity,
      audio.currentTime + 10
    )
  }

  function handleSeek(newTime) {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>🎙️ {getTranslation(language, 'title')}</h1>
          <p>{getTranslation(language, 'subtitle')}</p>
        </div>
        <div className={styles.toggles}>
          <ThemeToggle />
          <LanguageToggle />
        </div>
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

          <WaveformProgress
            audio={audioRef.current}
            current={currentTimeSeconds}
            currentDisplay={currentTime}
            duration={duration}
            durationSeconds={durationSeconds}
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

          {episode.notices && (
            <DetailDropdown notices={episode.notices} />
          )}
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  )
}
