"use client"

import { motion } from "framer-motion"
import { cn } from "@/components/utils"

interface WordCardProps {
  word: string
  definition: string
  type: "start" | "target"
}

export default function WordCard({ word, definition, type }: WordCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-lg p-5 shadow-lg text-white relative overflow-hidden",
        type === "start"
          ? "bg-gradient-to-br from-blue-500 to-blue-700"
          : "bg-gradient-to-br from-purple-500 to-purple-700",
      )}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: type === "start" ? 0.1 : 0.2,
      }}
      whileHover={{ y: -5 }}
    >
      <motion.div
        className="absolute inset-0 bg-white opacity-5"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 15,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
        style={{
          backgroundSize: "200% 200%",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%)",
        }}
      />

      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-2">{word}</h2>
        <p className="text-sm opacity-90 whitespace-pre-line">{definition}</p>
        <div className="absolute top-2 right-2 text-xs font-medium px-2 py-1 bg-white/20 rounded-full">
          {type === "start" ? "Start" : "Target"}
        </div>
      </div>
    </motion.div>
  )
}
