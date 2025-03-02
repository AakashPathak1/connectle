"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lightbulb, Loader2 } from "lucide-react"
import SimilarityMeter from "./similarity-meter"

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
  disabled?: boolean
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
  isSuccess,
  disabled = false
}: WordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [shouldFocusAndSelect, setShouldFocusAndSelect] = useState(false)

  // Only focus and select when explicitly triggered
  useEffect(() => {
    if (shouldFocusAndSelect && inputRef.current && !isProcessing) {
      // Small delay to ensure the focus happens after the UI updates
      setTimeout(() => {
        if (inputRef.current) {
          // Focus with a user activation event to keep mobile keyboard open
          inputRef.current.focus()
          inputRef.current.select()
          
          // On mobile, try to force the keyboard to stay open
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // Touch events can help keep the keyboard open on some mobile browsers
            inputRef.current.click()
            
            // For iOS specifically
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              // iOS sometimes needs a double-tap approach
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.focus()
                }
              }, 100)
            }
          }
        }
      }, 50)
      setShouldFocusAndSelect(false)
    }
  }, [shouldFocusAndSelect, isProcessing])

  // Focus on initial render with enhanced mobile support
  useEffect(() => {
    if (inputRef.current) {
      // Focus with a user activation event to keep mobile keyboard open
      inputRef.current.focus()
      
      // On mobile, try to force the keyboard to stay open
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Touch events can help keep the keyboard open on some mobile browsers
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.click()
          }
        }, 100)
      }
    }
  }, [])

  // Prevent the input from losing focus on mobile
  const preventBlur = () => {
    // Only prevent blur on mobile devices and when not disabled
    if (!disabled && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // This timeout allows other events to process but quickly refocuses
      setTimeout(() => {
        if (inputRef.current && !disabled && !isProcessing) {
          inputRef.current.focus()
        }
      }, 10)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWord.trim() || isProcessing || disabled) return
    onSubmit(currentWord.trim())
    // Set flag to focus and select after submission is processed
    setShouldFocusAndSelect(true)
    
    // Force focus to keep mobile keyboard open
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Use a short timeout to allow the submission to process
      setTimeout(() => {
        if (inputRef.current) {
          // Force click and focus to keep keyboard open
          inputRef.current.click()
          inputRef.current.focus()
        }
      }, 50)
    }
  }

  // Helper function is no longer used - removed to fix ESLint error

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
          onBlur={preventBlur}
          onClick={() => inputRef.current?.focus()}
          placeholder={disabled ? "🎉 Game completed!" : "Enter your next word"}
          className={`w-full p-3 text-base ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={isProcessing || disabled}
          autoComplete="off"
          spellCheck="false"
          autoCapitalize="none"
          autoCorrect="off"
          data-lpignore="true"
          enterKeyHint="go"
          inputMode="text"
          autoFocus
        />
      </div>

      <AnimatePresence>
        {/* Only show error message when game is disabled/finished, hide similarity meter */}
        {(errorMessage || (similarity !== null && !disabled) || isInvalidWord || isSuccess) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {/* Don't show similarity meter when game is disabled */}
            {(isInvalidWord || (similarity !== null && !disabled)) && !isSuccess && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                {isInvalidWord || similarity === 0 ? (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    Not a valid English word
                  </span>
                ) : similarity !== null && similarity !== undefined ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${similarity <= 0.47 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}>
                        {similarity <= 0.47 ? "Not similar enough (below 50%)" : "Similarity"}
                      </span>
                    </div>
                    <SimilarityMeter 
                      similarity={similarity} 
                      threshold={0.47} 
                      showPercentage={true} 
                      height={10}
                    />
                  </div>
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
            
            {isSuccess && similarity !== null && similarity !== undefined && similarity > 0.47 && !disabled && (
              <div className="p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                <div className="space-y-2">
                  <span className="font-semibold">Word accepted!</span>
                  <SimilarityMeter 
                    similarity={similarity} 
                    threshold={0.47} 
                    showPercentage={true} 
                    height={10}
                    className="mt-2"
                  />
                </div>
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
          disabled={wordChainLength <= 1 || isProcessing || disabled}
          variant="outline"
          className={`w-1/5 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block">Back</span>
        </Button>
        
        <Button
          type="submit"
          disabled={isProcessing || !currentWord.trim() || disabled}
          className={`w-3/5 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isProcessing && !disabled ? (
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
          disabled={isHintLoading || wordChainLength === 0 || isProcessing || disabled}
          variant="secondary"
          className={`w-1/5 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
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
