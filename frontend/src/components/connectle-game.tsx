"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import WordCard from "./word-card"
import WordChain from "./word-chain"
import WordInput from "./word-input"
import HintDisplay from "./hint-display"
import InfoButton from "./info-button"
import StatsModal from "./stats-modal"
import { trackGameEvents } from "../utils/analytics"

interface Puzzle {
  startWord: string
  endWord: string
  startDefinition: string
  endDefinition: string
}

interface HintCandidate {
  word: string
  similarity_to_current: number
  similarity_to_target: number
}

interface HintResponse {
  hint: string | null
  message: string
  similarity_to_current: number
  similarity_to_target: number
  similarity_between_current_and_target: number
  all_top_candidates?: HintCandidate[]
}

interface ConnectleGameProps {
  apiBaseUrl: string
  puzzle: Puzzle
}

export default function ConnectleGame({ apiBaseUrl, puzzle }: ConnectleGameProps) {
  const [wordChain, setWordChain] = useState<string[]>([puzzle.startWord])
  const [currentWord, setCurrentWord] = useState("")
  const [isCheckingWord, setIsCheckingWord] = useState(false)
  const [wordError, setWordError] = useState<string | null>(null)
  const [lastSimilarity, setLastSimilarity] = useState<number | null>(null)
  const [invalidWord, setInvalidWord] = useState<boolean>(false)
  const [hintData, setHintData] = useState<HintResponse | null>(null)
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [isGameLocked, setIsGameLocked] = useState(false)
  const [gameStartTime] = useState<number>(Date.now())
  
  // Effect to show stats modal when game is won
  useEffect(() => {
    if (hasWon) {
      console.log('hasWon changed to true, locking game...');
      setIsGameLocked(true);
      
      // Track game completion
      const timeSpent = Date.now() - gameStartTime;
      trackGameEvents.completeGame(wordChain.length, timeSpent);
    }
  }, [hasWon, wordChain.length, gameStartTime]);
  const [wordAccepted, setWordAccepted] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)

  // Check if a word is valid English and not a duplicate (in singular form)
  const checkIsValidWord = async (word: string) => {
    try {
      // Send the current word chain to check for duplicates in singular form
      const wordChainParam = encodeURIComponent(JSON.stringify(wordChain))
      const response = await fetch(`${apiBaseUrl}/api/check-word?word=${encodeURIComponent(word)}&word_chain=${wordChainParam}`)
      const data = await response.json()
      console.log("Word validation response:", data)
      
      // Check if the word is already in the chain (in singular form)
      if (data.already_in_chain) {
        const duplicateWord = data.duplicate_word || 'a word'
        setWordError(`"${word}" is the same as "${duplicateWord}" which is already in your chain. Try a different word.`)
        setInvalidWord(false) // Important: Don't mark as invalid word, we have a specific error
        return { isValid: false, isDuplicate: true }
      }
      
      return { isValid: data.is_valid, isDuplicate: false }
    } catch (error) {
      console.error("Error checking word validity:", error)
      setGameError("Failed to check word validity. Please try again.")
      return { isValid: false, isDuplicate: false }
    }
  }

  // Check similarity between two words
  const checkWordSimilarity = async (word1: string, word2: string) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/check-similarity?word1=${encodeURIComponent(word1)}&word2=${encodeURIComponent(word2)}`
      )
      const data = await response.json()
      return data.similarity
    } catch (error) {
      console.error("Error checking word similarity:", error)
      setGameError("Failed to check word similarity. Please try again.")
      throw error
    }
  }

  // Handle backtracking in the word chain
  const handleBacktrack = () => {
    if (wordChain.length <= 1) return
    
    const newWordChain = [...wordChain]
    newWordChain.pop()
    setWordChain(newWordChain)
    setCurrentWord("")
    setWordError(null)
    setLastSimilarity(null)
    setInvalidWord(false)
    setHintData(null)
    
    // Track backtrack event
    trackGameEvents.backtrack(newWordChain.length);
  }

  // Get a hint
  const getHint = async () => {
    if (isLoadingHint || wordChain.length === 0 || isProcessing) return
    
    // Track hint request
    trackGameEvents.requestHint();
    
    setIsLoadingHint(true)
    setIsProcessing(true)
    
    try {
      const lastWord = wordChain[wordChain.length - 1]
      const response = await fetch(
        `${apiBaseUrl}/api/get-hint?current_word=${encodeURIComponent(lastWord)}&target_word=${encodeURIComponent(puzzle.endWord)}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to get hint")
      }
      
      const data = await response.json()
      setHintData(data)
      setHintsUsed(prev => prev + 1)
    } catch (error) {
      console.error("Error getting hint:", error)
      setGameError("Failed to get hint. Please try again.")
    } finally {
      setIsLoadingHint(false)
      setIsProcessing(false)
    }
  }

  // Handle word submission
  const handleWordSubmit = async (submittedWord: string) => {
    if (isCheckingWord || !submittedWord || isProcessing) return
    
    setIsProcessing(true)
    setIsCheckingWord(true)
    setWordError(null)
    setWordAccepted(false)
    setLastSimilarity(null)
    setInvalidWord(false)
    
    const normalizedWord = submittedWord.trim().toLowerCase()
    
    // Removed direct check for game completion - we'll only check after similarity validation
    
    // Don't allow submitting the same word as the last one in the chain
    if (wordChain.length > 0 && normalizedWord === wordChain[wordChain.length - 1].toLowerCase()) {
      setWordError("You already used this word. Try a different one.")
      setIsCheckingWord(false)
      setIsProcessing(false)
      return
    }
    
    // Don't allow submitting a word that's already in the chain
    if (wordChain.some(word => word.toLowerCase() === normalizedWord)) {
      setWordError("This word is already in your chain. Try a different one.")
      setIsCheckingWord(false)
      setIsProcessing(false)
      return
    }
    
    try {
      // First check if it's a valid English word and not a duplicate
      const { isValid, isDuplicate } = await checkIsValidWord(normalizedWord)
      
      if (!isValid) {
        setIsCheckingWord(false)
        setIsProcessing(false)
        setCurrentWord(normalizedWord)
        
        // Only set invalidWord flag if it's not a duplicate (which already has a specific error)
        if (!isDuplicate) {
          setInvalidWord(true)
          // Clear any previous error message so the "Not a valid English word" shows up
          setWordError(null);
        }
        // If it is a duplicate, the error message was already set in checkIsValidWord
        
        setLastSimilarity(null)
        return
      }
      
      try {
        // Now check if it's similar enough to the last word in the chain
        const lastWord = wordChain[wordChain.length - 1].toLowerCase()
        
        // Use the validation endpoint which checks both validity and similarity
        const validationResponse = await fetch(
          `${apiBaseUrl}/api/validate-word?current_word=${encodeURIComponent(lastWord)}&next_word=${encodeURIComponent(normalizedWord)}`
        )
        
        const validationData = await validationResponse.json()
        
        // Extract similarity value regardless of is_valid flag
        const similarityValue = validationData.similarity !== undefined 
          ? validationData.similarity
          : 0
        
        setLastSimilarity(similarityValue)
        
        // Special case: If this is the target word and similarity is high enough, allow it
        const isTargetWord = normalizedWord.toLowerCase() === puzzle.endWord.toLowerCase()
        
        // If the word is the target word and similarity is high enough, we should accept it
        // regardless of what the API says about validity
        if (isTargetWord && similarityValue > 0.47) {
          console.log(`Target word ${normalizedWord} detected with similarity ${similarityValue} > 0.47, accepting it`)
          // Continue to the winning logic below
        } 
        // Otherwise, check the API's validity response
        else if (!validationData.is_valid) {
          if (validationData.error === "not_a_word") {
            setInvalidWord(true)
            setLastSimilarity(null)
          } else {
            // This is for words that are valid English words but not similar enough
            // If similarity is 0, treat as invalid word
            if (similarityValue === 0) {
              setInvalidWord(true)
            } else {
              setInvalidWord(false)
            }
            
            setWordError(null)
          }
          setIsCheckingWord(false)
          setIsProcessing(false)
          return
        }
        
        // We've already extracted similarityValue above, so we don't need to do it again
        
        // Make sure the similarity is above the threshold (0.47 or 47%)
        if (similarityValue <= 0.47) {
          console.log(`Word ${normalizedWord} has similarity ${similarityValue} which is below threshold 0.47`)
          // Special message if they're trying to jump directly to the target word
          if (normalizedWord.toLowerCase() === puzzle.endWord.toLowerCase()) {
            console.log('Target word detected but similarity is too low!')
            setWordError("You found the target word, but it's not similar enough to your previous word. Find a path of similar words!")
          } else {
            setWordError("Word is valid but not similar enough to your previous word.")
          }
          setIsCheckingWord(false)
          setIsProcessing(false)
          return
        }
        
        console.log(`Word ${normalizedWord} has similarity ${similarityValue} which is above threshold 0.47`)
        
        // If we got here, the word is both valid and similar enough
        const newWordChain = [...wordChain, normalizedWord]
        setWordChain(newWordChain)
        // Clear the input field but don't lose focus
        setCurrentWord("")
        setIsCheckingWord(false)
        // Clear hint data when a valid word is submitted
        setHintData(null)
        setWordAccepted(true)
        
        // Track successful word submission
        trackGameEvents.wordSubmitted(normalizedWord, true, similarityValue)
        
        // Check if the player has won
        // Now we can be sure the word is both valid AND similar enough
        if (normalizedWord.toLowerCase() === puzzle.endWord.toLowerCase()) {
          console.log('Game completed! Word is valid and similar enough.')
          setWordError("Congratulations! You've completed the puzzle! 🎉")
          setShowConfetti(true)
          setHasWon(true)
          setIsGameLocked(true) // Lock the game immediately
          
          // Show stats modal after a short delay to allow animations to complete
          setTimeout(() => {
            console.log('Opening stats modal after valid word submission')
            setShowStatsModal(true)
          }, 500)
        }
        
        return
      } catch (error) {
        console.error("Error validating word:", error)
        // Track error
        trackGameEvents.error("validation_error", String(error));
        // If validation fails, fall back to checking similarity directly
      }

      // This is the fallback path if the API call failed
      try {
        // We should only reach here if the word is a valid English word
        // but we need to check similarity
        const lastWord = wordChain[wordChain.length - 1].toLowerCase()
        const similarity = await checkWordSimilarity(lastWord, normalizedWord)

        // If similarity is 0, treat as invalid word
        if (similarity === 0) {
          setInvalidWord(true)
          setLastSimilarity(similarity)
          setIsCheckingWord(false)
          setIsProcessing(false)
          return
        }

        // Special case: If this is the target word and similarity is high enough, always accept it
        const isTargetWord = normalizedWord.toLowerCase() === puzzle.endWord.toLowerCase()

        if (similarity > 0.47 || (isTargetWord && similarity > 0.47)) {
          setLastSimilarity(similarity)
          setInvalidWord(false)
          setWordChain([...wordChain, normalizedWord])
          setCurrentWord("")  // Clear the input field
          // Clear hint data when a valid word is submitted
          setHintData(null)
          setWordAccepted(true)
          
          // Check if we've reached the end word - but only if similarity is high enough
          if (isTargetWord) {
            console.log('Game completed in fallback path! Word is valid and similar enough.')
            setWordError("Congratulations! You've completed the puzzle! 🎉")
            setShowConfetti(true)
            setHasWon(true)
            setIsGameLocked(true) // Lock the game immediately
            
            // Show stats modal after a short delay
            setTimeout(() => {
              console.log('Opening stats modal after valid word submission (fallback path)')
              setShowStatsModal(true)
            }, 500)
          }
        } else {
          setLastSimilarity(similarity)
          setWordError("The word is not similar enough to the previous word.")
          setInvalidWord(true)
        }
      } catch (err) {
        console.error('Error checking word similarity:', err)
        setGameError('Error checking word similarity. Please try again.')
      }
    } catch (err) {
      console.error('Error checking word:', err)
      setGameError('Error checking word. Please try again.')
    } finally {
      setIsCheckingWord(false)
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
      {gameError && (
        <div className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100">
          <p>{gameError}</p>
          <button 
            className="mt-2 text-xs underline"
            onClick={() => setGameError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Stats Modal with Confetti */}
      <StatsModal 
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false);
          // Always lock the game after closing the modal if the game has been won
          if (hasWon) {
            console.log('Game won, locking game after modal close');
            setIsGameLocked(true);
          }
        }}
        wordChain={wordChain}
        hintsUsed={hintsUsed}
        startWord={puzzle.startWord}
        endWord={puzzle.endWord}
        showConfetti={showConfetti}
        lockGame={() => setIsGameLocked(true)}
      />
      
      
      <motion.div className="w-full max-w-4xl mx-auto space-y-8 relative">
        <div className="flex justify-center w-full mb-4">
          <InfoButton />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <WordCard 
            word={puzzle.startWord} 
            definition={puzzle.startDefinition}
            type="start"
          />
          
          <WordCard 
            word={puzzle.endWord} 
            definition={puzzle.endDefinition}
            type="target"
          />
        </div>

        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Word Chain</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-gray-600 dark:text-gray-400">
                Words: {wordChain.length}
              </div>
              <div className="text-purple-600 dark:text-purple-400">
                Hints: {hintsUsed}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <WordChain words={wordChain} />
          </div>

          <WordInput 
            onSubmit={handleWordSubmit}
            onBacktrack={handleBacktrack}
            onRequestHint={getHint}
            isProcessing={isProcessing || isGameLocked}
            isHintLoading={isLoadingHint}
            currentWord={currentWord}
            setCurrentWord={setCurrentWord}
            wordChainLength={wordChain.length}
            similarity={lastSimilarity}
            errorMessage={isGameLocked ? "🎉 Congratulations! You've finished today's game." : wordError}
            isInvalidWord={invalidWord}
            isSuccess={wordAccepted || hasWon}
            disabled={isGameLocked}
          />
          
          <AnimatePresence>
            {hintData && (
              <HintDisplay 
                hint={hintData.hint}
                message={hintData.message}
                candidates={hintData.all_top_candidates}
                wordChain={wordChain}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

    </div>
  )
}
