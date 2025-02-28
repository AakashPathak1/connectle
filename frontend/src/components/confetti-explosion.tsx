"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface ConfettiPiece {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  duration: number
  delay: number
}

export default function ConfettiExplosion() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    const colors = [
      "#3B82F6", // blue
      "#8B5CF6", // purple
      "#EC4899", // pink
      "#10B981", // green
      "#F59E0B", // amber
    ]

    const pieces: ConfettiPiece[] = []

    for (let i = 0; i < 100; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 500 - 250,
        y: Math.random() * -500,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: Math.random() * 0.6 + 0.4,
        duration: Math.random() * 1 + 1.5,
        delay: Math.random() * 0.3,
      })
    }

    setConfetti(pieces)

    // Clean up after animation
    const timer = setTimeout(() => {
      setConfetti([])
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-sm"
          style={{ backgroundColor: piece.color }}
          initial={{
            x: 0,
            y: 0,
            rotate: 0,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: piece.x,
            y: piece.y,
            rotate: piece.rotation,
            scale: piece.scale,
            opacity: [1, 1, 0], // Start fully visible, stay visible, then fade to transparent
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: [0.1, 0.25, 0.3, 1],
            opacity: {
              duration: piece.duration,
              times: [0, 0.7, 1], // Start fade at 70% of the animation
            }
          }}
        />
      ))}
    </div>
  )
}
