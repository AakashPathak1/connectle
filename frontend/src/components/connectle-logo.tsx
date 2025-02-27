"use client"

import { motion } from "framer-motion"

interface ConnectleLogoProps {
  className?: string
}

export default function ConnectleLogo({ className }: ConnectleLogoProps) {
  return (
    <div className={className}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M4 6h16M4 12h16M4 18h16"
          stroke="url(#connectle-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", repeatDelay: 2 }}
        />
        <motion.circle
          cx="8"
          cy="6"
          r="2"
          fill="url(#connectle-blue)"
          initial={{ scale: 0.5, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", repeatDelay: 1 }}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="2"
          fill="url(#connectle-purple)"
          initial={{ scale: 0.5, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            repeatDelay: 1,
            delay: 0.2,
          }}
        />
        <motion.circle
          cx="16"
          cy="18"
          r="2"
          fill="url(#connectle-pink)"
          initial={{ scale: 0.5, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            repeatDelay: 1,
            delay: 0.4,
          }}
        />
        <defs>
          <linearGradient id="connectle-gradient" x1="4" y1="6" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="0.5" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
          <radialGradient
            id="connectle-blue"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(8 6) rotate(90) scale(2)"
          >
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#2563EB" />
          </radialGradient>
          <radialGradient
            id="connectle-purple"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(12 12) rotate(90) scale(2)"
          >
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#7C3AED" />
          </radialGradient>
          <radialGradient
            id="connectle-pink"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(16 18) rotate(90) scale(2)"
          >
            <stop stopColor="#EC4899" />
            <stop offset="1" stopColor="#DB2777" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
