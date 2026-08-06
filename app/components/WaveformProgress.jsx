'use client'

import { useEffect, useRef } from 'react'
import styles from './WaveformProgress.module.css'

export default function WaveformProgress({ audio, current, currentDisplay, duration, durationSeconds, onSeek }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const animationIdRef = useRef(null)

  useEffect(() => {
    if (!audio || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      if (!analyserRef.current) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256

        if (!sourceRef.current) {
          const source = audioContext.createMediaElementAudioSource(audio)
          source.connect(analyser)
          analyser.connect(audioContext.destination)
          sourceRef.current = source
        }

        analyserRef.current = analyser
      }
    } catch (e) {
      console.error('Error initializing audio context:', e)
      return
    }

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw)

      try {
        analyser.getByteFrequencyData(dataArray)
      } catch (e) {
        // Silently handle errors
      }

      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, width, height)

      const sliceWidth = (width * 1.0) / bufferLength
      let x = 0

      ctx.strokeStyle = '#667eea'
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * height) / 2

        if (i === 0) {
          ctx.moveTo(x, height / 2)
        } else {
          ctx.lineTo(x, height / 2 - y)
        }

        x += sliceWidth
      }

      ctx.lineTo(width, height / 2)
      ctx.stroke()

      if (durationSeconds > 0) {
        const progressX = (current / durationSeconds) * width
        ctx.fillStyle = '#764ba2'
        ctx.fillRect(progressX - 2, 0, 4, height)
      }
    }

    draw()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [audio, current, durationSeconds])

  function handleSeek(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * durationSeconds
    onSeek(newTime)
  }

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        className={styles.canvas}
        onClick={handleSeek}
      />
      <div className={styles.times}>
        <span>{currentDisplay}</span>
        <span>{duration}</span>
      </div>
    </div>
  )
}
