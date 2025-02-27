"use client"

import { motion } from "framer-motion"
import { cn } from "@/components/utils"

interface WordChainProps {
  words: string[]
}

export default function WordChain({ words }: WordChainProps) {
  if (!words.length) return null
  
  return (
    <div className="w-full overflow-x-auto scrollbar-thin pb-2">
      <div className="flex items-center space-x-2 min-w-max">
        {words.map((word, index) => (
          <motion.div
            key={`${word}-${index}`}
            className={cn(
              "px-3 py-1.5 rounded-full font-medium text-sm",
              index === 0 
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200" 
                : index === words.length - 1 && words.length > 1
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            {word}
            {index < words.length - 1 && (
              <motion.span 
                className="inline-block mx-2 text-gray-400 dark:text-gray-500"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ duration: 0.2, delay: 0.1 * index + 0.2 }}
              >
                →
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
