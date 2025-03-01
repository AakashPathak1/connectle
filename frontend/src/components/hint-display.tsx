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
  wordChain?: string[]
}

export default function HintDisplay({
  hint,
  message,
  candidates = [],
  wordChain = []
}: HintDisplayProps) {
  if (!candidates.length && !message) return null

  // Scale factor to normalize similarity values (47% becomes 50%)
  const scaleFactor = 0.50 / 0.47;

  // Simple filtering to remove duplicates
  const filteredCandidates = candidates.filter((candidate, index, self) => 
    index === self.findIndex(c => c.word.toLowerCase() === candidate.word.toLowerCase())
  );

  // Filter out candidates that are already in the word chain
  const availableCandidates = filteredCandidates.filter(
    candidate => !wordChain.some(word => word.toLowerCase() === candidate.word.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6 p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
        Word Suggestions
        <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
          Choose a word that connects your last word to the goal word
        </p>
      </h4>
      
      {message && hint === null && (
        <p className="text-amber-600 dark:text-amber-400 mb-3">{message}</p>
      )}
      
      {availableCandidates.length > 0 ? (
        <div className="space-y-2">
          {availableCandidates.map((candidate, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors gap-2"
            >
              <div className="font-medium text-gray-900 dark:text-white text-lg">{candidate.word}</div>
              <div className="text-sm flex flex-row flex-wrap justify-end gap-2 mt-1 sm:mt-0">
                <span className="text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  <span className="hidden sm:inline">Similarity to </span>Last Word: {(Math.min(candidate.similarity_to_current * scaleFactor, 1) * 100).toFixed(1)}%
                </span>
                <span className="text-purple-600 dark:text-purple-400 whitespace-nowrap">
                  <span className="hidden sm:inline">Similarity to </span>Goal: {(Math.min(candidate.similarity_to_target * scaleFactor, 1) * 100).toFixed(1)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
          <p className="font-medium">
            {filteredCandidates.length > 0 
              ? "All suggested words are already in your word chain. Try backtracking to a previous word and taking a different path." 
              : "No suitable word suggestions available. Try entering a different word that might be more closely related to the goal word."}
          </p>
        </div>
      )}
    </motion.div>
  )
}
