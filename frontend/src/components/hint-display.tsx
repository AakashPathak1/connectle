"use client"

import { motion } from "framer-motion"

interface HintCandidate {
  word: string
  similarity_to_current: number
  similarity_to_target: number
}

interface HintDisplayProps {
  hint: string | null
  message: string
  candidates?: HintCandidate[]
}

export default function HintDisplay({
  hint,
  message,
  candidates = []
}: HintDisplayProps) {
  if (!candidates.length && !message) return null

  // Simple filtering to remove duplicates
  const filteredCandidates = candidates.filter((candidate, index, self) => 
    index === self.findIndex(c => c.word.toLowerCase() === candidate.word.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6 p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
        Hint Suggestions
      </h4>
      
      {message && hint === null && (
        <p className="text-amber-600 dark:text-amber-400 mb-3">{message}</p>
      )}
      
      {filteredCandidates.length > 0 ? (
        <div className="space-y-2">
          {filteredCandidates.map((candidate, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">{candidate.word}</div>
              <div className="text-sm flex flex-col sm:flex-row sm:space-x-3">
                <span className="text-blue-600 dark:text-blue-400">
                  Current: {(candidate.similarity_to_current * 100).toFixed(1)}%
                </span>
                <span className="text-purple-600 dark:text-purple-400">
                  Target: {(candidate.similarity_to_target * 100).toFixed(1)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
          <p className="font-medium">
            {candidates.length > 0 
              ? "Best guesses are already in your word chain. It might be best to backtrack." 
              : "No suitable hints available."}
          </p>
        </div>
      )}
    </motion.div>
  )
}
