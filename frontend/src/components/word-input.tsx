"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lightbulb, Loader2 } from "lucide-react"

interface WordInputProps {
  onSubmit: (word: string) => void
  onBacktrack: () => void
  onRequestHint: () => void
  isProcessing: boolean
  isHintLoading: boolean
  currentWord: string
  setCurrentWord: (word: string) => void
  wordChainLength: number
  similarity?: number | null
  errorMessage?: string | null
  isInvalidWord?: boolean
  isSuccess?: boolean
}

export default function WordInput({
  onSubmit,
  onBacktrack,
  onRequestHint,
  isProcessing,
  isHintLoading,
  currentWord,
  setCurrentWord,
  wordChainLength,
  similarity,
  errorMessage,
  isInvalidWord,
  isSuccess
}: WordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [shouldFocusAndSelect, setShouldFocusAndSelect] = useState(false)

  // Only focus and select when explicitly triggered
  useEffect(() => {
    if (shouldFocusAndSelect && inputRef.current && !isProcessing) {
      inputRef.current.focus()
      inputRef.current.select()
      setShouldFocusAndSelect(false)
    }
  }, [shouldFocusAndSelect, isProcessing])

  // Focus on initial render
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWord.trim() || isProcessing) return
    onSubmit(currentWord.trim())
    // Set flag to focus and select after submission is processed
    setShouldFocusAndSelect(true)
  }

  // Helper function to determine color based on similarity
  const getSimilarityColor = (sim: number) => {
    if (sim > 0.5) return "text-green-600 dark:text-green-400"
    if (sim === 0) return "text-red-600 dark:text-red-400"
    // Create a gradient from red to green
    return `text-[rgb(${Math.floor(255 - (sim * 2 * 255))},${Math.floor(sim * 2 * 255)},0)]`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={currentWord}
          onChange={(e) => {
            setCurrentWord(e.target.value.toLowerCase())
          }}
          placeholder="Enter your next word"
          className="w-full p-3 text-base"
          disabled={isProcessing}
        />
      </div>

      <AnimatePresence>
        {(errorMessage || similarity !== null || isInvalidWord || isSuccess) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {(isInvalidWord || similarity !== null) && !isSuccess && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                {isInvalidWord || similarity === 0 ? (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    Not a valid English word
                  </span>
                ) : similarity !== null ? (
                  similarity <= 0.5 ? (
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">
                      Not similar enough: {(similarity * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <span className={`font-semibold ${getSimilarityColor(similarity)}`}>
                      Similarity: {(similarity * 100).toFixed(1)}%
                    </span>
                  )
                ) : null}
              </div>
            )}
            
            {errorMessage && !isInvalidWord && (
              <div 
                className={`p-3 rounded-lg ${
                  isSuccess 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200" 
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                }`}
              >
                {errorMessage}
              </div>
            )}
            
            {isSuccess && similarity !== null && similarity > 0.5 && (
              <div className="p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                <span className="font-semibold">
                  Word accepted! Similarity: {(similarity * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={() => {
            onBacktrack()
            setShouldFocusAndSelect(true)
          }}
          disabled={wordChainLength <= 1 || isProcessing}
          variant="outline"
          className="w-1/5"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block">Back</span>
        </Button>
        
        <Button
          type="submit"
          disabled={isProcessing || !currentWord.trim()}
          className="w-3/5"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            "Submit Word"
          )}
        </Button>
        
        <Button
          type="button"
          onClick={onRequestHint}
          disabled={isHintLoading || wordChainLength === 0 || isProcessing}
          variant="secondary"
          className="w-1/5"
        >
          {isHintLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
          <span className="sr-only sm:not-sr-only sm:inline-block ml-1">Hint</span>
        </Button>
      </div>
    </form>
  )
}
