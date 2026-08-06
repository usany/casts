'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './WaveformProgress.module.css'

export default function WaveformProgress({ audio, current, currentDisplay, duration, durationSeconds, onSeek }) {
  const canvasRef = useRef(null)
  const animationIdRef = useRef(null)
  const [waveformData, setWaveformData] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!audio || !audio.src) {
      console.log('No audio or src:', { audio: !!audio, src: audio?.src })
      return
    }

    const analyzeAudio = async () => {
      try {
        console.log('Starting audio analysis for:', audio.src)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        console.log('AudioContext created')

        const response = await fetch(audio.src)
        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.status}`)
        }
        console.log('Audio file fetched')

        const arrayBuffer = await response.arrayBuffer()
        console.log('ArrayBuffer ready, size:', arrayBuffer.byteLength)

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        console.log('Audio decoded, duration:', audioBuffer.duration)

        const rawData = audioBuffer.getChannelData(0)
        const samples = 200
        const blockSize = Math.floor(rawData.length / samples)
        const waveformArray = []

        for (let i = 0; i < samples; i++) {
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j])
          }
          waveformArray.push(sum / blockSize)
        }

        console.log('Waveform data created:', waveformArray.length, 'bars')
        setWaveformData(waveformArray)
      } catch (error) {
        console.error('Error analyzing audio:', error)
      }
    }

    analyzeAudio()
  }, [audio])

  useEffect(() => {
    if (!canvasRef.current || !waveformData || waveformData.length === 0) {
      console.log('Canvas not ready:', { canvas: !!canvasRef.current, data: !!waveformData })
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const barCount = waveformData.length
    const barWidth = width / barCount

    // Find max value for scaling (outside draw loop)
    const maxValue = Math.max(...waveformData)

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw)

      // Clear canvas
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, width, height)

      // Draw waveform bars
      ctx.fillStyle = '#667eea'

      for (let i = 0; i < barCount; i++) {
        const value = waveformData[i] || 0
        const scaledValue = maxValue > 0 ? value / maxValue : 0
        const barHeight = scaledValue * height * 0.8

        const x = i * barWidth
        const y = (height - barHeight) / 2

        if (barHeight > 0) {
          ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight)
        }
      }

      // Draw progress indicator
      if (durationSeconds > 0) {
        const progressX = (current / durationSeconds) * width
        ctx.fillStyle = '#764ba2'
        ctx.fillRect(Math.max(progressX - 2, 0), 0, 4, height)
      }
    }

    draw()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [current, durationSeconds, waveformData])

  function handleSeek(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * durationSeconds
    onSeek(newTime)
  }

  function handleMouseDown(e) {
    setIsDragging(true)
    handleSeek(e)
  }

  function handleMouseMove(e) {
    if (!isDragging) return
    handleSeek(e)
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  function handleMouseLeave() {
    setIsDragging(false)
  }

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        className={styles.canvas}
        onClick={handleSeek}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />
      <div className={styles.times}>
        <span>{currentDisplay}</span>
        <span>{duration}</span>
      </div>
    </div>
  )
}
