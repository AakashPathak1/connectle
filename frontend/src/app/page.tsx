'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Puzzle {
  startWord: string;
  endWord: string;
  startDefinition: string;
  endDefinition: string;
}

interface HintCandidate {
  word: string;
  similarity_to_current: number;
  similarity_to_target: number;
}

interface HintResponse {
  hint: string | null;
  message: string;
  similarity_to_current: number;
  similarity_to_target: number;
  similarity_between_current_and_target: number;
  all_top_candidates?: HintCandidate[];
}

// API URL configuration
const isProduction = process.env.NODE_ENV === 'production';
const API_BASE_URL = isProduction 
  ? '' // Empty string for relative URLs in production
  : 'http://localhost:5001'; // Use localhost in development

export default function Home() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wordChain, setWordChain] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [isCheckingWord, setIsCheckingWord] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);
  const [lastSimilarity, setLastSimilarity] = useState<number | null>(null);
  const [invalidWord, setInvalidWord] = useState<boolean>(false);
  const [shouldFocus, setShouldFocus] = useState(true);
  const [hintData, setHintData] = useState<HintResponse | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false); // New state for tracking any API request
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle input focus
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      const input = inputRef.current;
      // Small delay to ensure DOM is ready
      const timeoutId = window.setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
      return () => window.clearTimeout(timeoutId);
    }
  }, [shouldFocus]);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/daily-puzzle`);
        setPuzzle({
          startWord: response.data.startWord,
          endWord: response.data.endWord,
          startDefinition: response.data.startDefinition,
          endDefinition: response.data.endDefinition
        });
        setWordChain([response.data.startWord]);
      } catch (error) {
        console.error("Error fetching puzzle:", error);
        setError("Failed to load puzzle. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPuzzle();
  }, []);

  const checkWordSimilarity = async (word1: string, word2: string) => {
    try {
      setIsProcessing(true); // Set processing state to true
      const response = await axios.get(`${API_BASE_URL}/api/check-similarity`, {
        params: { word1, word2 }
      });
      return response.data.similarity;
    } catch (error) {
      console.error('Error checking word similarity:', error);
      throw error;
    } finally {
      setIsProcessing(false); // Reset processing state
    }
  };

  const getHint = async () => {
    if (!puzzle) return;
    
    setIsLoadingHint(true);
    setHintData(null);
    setIsProcessing(true); // Set processing state to true
    
    try {
      const currentWordInChain = wordChain[wordChain.length - 1].toLowerCase();
      const targetWord = puzzle.endWord.toLowerCase();
      
      const response = await axios.get(`${API_BASE_URL}/api/hint`, {
        params: { 
          current_word: currentWordInChain,
          target_word: targetWord
        }
      });
      
      setHintData(response.data);
      setHintsUsed(prev => prev + 1); // Increment the hints used counter
    } catch (error) {
      console.error('Error getting hint:', error);
      setError('Failed to get hint. Please try again.');
    } finally {
      setIsLoadingHint(false);
      setIsProcessing(false); // Reset processing state
    }
  };

  const handleBacktrack = () => {
    if (wordChain.length <= 1) return; // Don't remove the start word
    
    // Remove the last word from the chain
    setWordChain(prev => prev.slice(0, -1));
    
    // Clear any errors or hint data
    setWordError(null);
    setHintData(null);
    setLastSimilarity(null);
    setInvalidWord(false);
    
    // Focus the input
    setShouldFocus(true);
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord.trim() || isCheckingWord || isProcessing) return; // Prevent submission if already processing

    setIsCheckingWord(true);
    setWordError(null);
    setInvalidWord(false);
    setHintData(null); // Clear hint data when submitting a new word
    setIsProcessing(true); // Set processing state to true
    
    const normalizedWord = currentWord.toLowerCase().trim();
    
    // Check if word is already in chain
    if (wordChain.map(w => w.toLowerCase()).includes(normalizedWord)) {
      setInvalidWord(true);
      setWordError('Word already used in chain');
      setIsCheckingWord(false);
      setShouldFocus(true);
      setIsProcessing(false); // Reset processing state
      return;
    }

    try {
      // First, check if the word is valid using the API
      try {
        // Ensure we're sending the data in the correct format
        const payload = {
          current_word: wordChain[wordChain.length - 1],
          next_word: normalizedWord
        };
        
        console.log('Sending validation request with payload:', payload);
        
        const validationResponse = await axios.post(`${API_BASE_URL}/api/validate-word`, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Store the similarity value
        if (validationResponse.data.similarity !== undefined) {
          setLastSimilarity(validationResponse.data.similarity);
        }

        if (!validationResponse.data.valid) {
          setInvalidWord(true);
          // If there's an error message, display it
          if (validationResponse.data.message) {
            // Check if the message indicates it's not a valid English word
            if (validationResponse.data.message.includes('is not a valid English word')) {
              setWordError(`Not a valid word`);
              setLastSimilarity(null); // Don't show similarity for invalid words
            } else {
              setWordError(validationResponse.data.message);
            }
          } else {
            // This is for words that are valid English words but not similar enough
            const similarityValue = validationResponse.data.similarity !== undefined 
              ? validationResponse.data.similarity
              : 0;
            setLastSimilarity(similarityValue);
            setWordError(null); // Don't set a redundant error message
            setInvalidWord(false); // It's a valid word, just not similar enough
          }
          setIsCheckingWord(false);
          setShouldFocus(true);
          setIsProcessing(false); // Reset processing state
          return;
        }
        
        // If we got here, the word is valid, proceed with the game
        const newWordChain = [...wordChain, normalizedWord];
        setWordChain(newWordChain);
        setCurrentWord('');
        setIsCheckingWord(false);
        setShouldFocus(true);
        
        // Check if the player has won
        if (puzzle && normalizedWord.toLowerCase() === puzzle.endWord.toLowerCase()) {
          setWordError("Congratulations! You've completed the puzzle! 🎉");
        }
        
        return;
      } catch (error) {
        console.error("Error validating word:", error);
        // If validation fails, fall back to checking similarity directly
        // This allows the game to work even if the validation API is down
      }

      // This is the fallback path if the API call failed
      try {
        const lastWord = wordChain[wordChain.length - 1].toLowerCase();
        const similarity = await checkWordSimilarity(lastWord, normalizedWord);

        setLastSimilarity(similarity);
        if (similarity > 0.5) {
          setInvalidWord(false);
          setWordChain([...wordChain, normalizedWord]);
          setCurrentWord('');
          setIsCheckingWord(false);
          setShouldFocus(true);
          
          // Check if we've reached the end word
          if (normalizedWord === puzzle?.endWord.toLowerCase()) {
            setWordError("Congratulations! You've completed the puzzle! 🎉");
          }
        } else {
          setWordError(null); // Don't set a redundant error message
          setInvalidWord(false); // It's a valid word, just not similar enough
          setIsCheckingWord(false);
          setShouldFocus(true);
        }
      } catch (err) {
        console.error('Error checking word similarity:', err);
        setWordError('Error checking word similarity. Please try again.');
        setIsCheckingWord(false);
        setShouldFocus(true);
      }
    } catch (err) {
      console.error('Error checking word:', err);
      setWordError('Error checking word. Please try again.');
      setIsCheckingWord(false);
      setShouldFocus(true);
    } finally {
      setIsProcessing(false); // Reset processing state
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">Connectle</h1>
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        ) : puzzle ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-all hover:shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Start Word</h2>
                <p className="text-3xl mb-4 text-blue-600 dark:text-blue-400 font-bold">{puzzle.startWord}</p>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{puzzle.startDefinition}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-all hover:shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">End Word</h2>
                <p className="text-3xl mb-4 text-green-600 dark:text-green-400 font-bold">{puzzle.endWord}</p>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{puzzle.endDefinition}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Word Chain</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {wordChain.map((word, index) => (
                  <div key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                    {word} {index < wordChain.length - 1 && <span className="mx-2">→</span>}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Words in chain: {wordChain.length}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Hints used: {hintsUsed}
                </div>
              </div>

              <form onSubmit={handleWordSubmit} className="space-y-4">
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentWord}
                    onChange={(e) => {
                      setCurrentWord(e.target.value.toLowerCase());
                      setShouldFocus(false);
                    }}
                    onBlur={() => setShouldFocus(true)}
                    placeholder="Enter your next word"
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCheckingWord || isProcessing} // Disable input when processing
                  />
                </div>

                {(wordError || lastSimilarity !== null) && (
                  <div className="space-y-2">
                    {(lastSimilarity !== null || invalidWord) && (
                      <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                        {invalidWord ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            Not a valid word
                          </span>
                        ) : lastSimilarity !== null && lastSimilarity <= 0.5 ? (
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">
                            Not similar enough ({(lastSimilarity * 100).toFixed(1)}%)
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold">Similarity: </span>
                            <span 
                              className={`font-semibold ${lastSimilarity !== null ? 
                                lastSimilarity > 0.5 ? 
                                  'text-green-600 dark:text-green-400' : 
                                  lastSimilarity === 0 ? 
                                    'text-red-600 dark:text-red-400' : 
                                    `text-[rgb(${Math.floor(255 - (lastSimilarity * 2 * 255))},${Math.floor(lastSimilarity * 2 * 255)},0)]`
                                : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {lastSimilarity !== null ? `${(lastSimilarity * 100).toFixed(1)}%` : '0%'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {wordError && !invalidWord && !wordError.includes('not similar enough') && (
                      <div className={`p-3 rounded-lg ${wordError.includes('Congratulations') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
                        {wordError}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Go Back Button */}
                  <button
                    type="button"
                    onClick={handleBacktrack}
                    disabled={wordChain.length <= 1 || isProcessing} // Disable when processing
                    className="w-1/5 bg-gray-500 text-white py-3 px-2 rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    ← Back
                  </button>
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isCheckingWord || !currentWord.trim() || isProcessing} // Disable when processing
                    className="w-3/5 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCheckingWord || isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Submit Word'
                    )}
                  </button>
                  
                  {/* Hint Button */}
                  <button
                    type="button"
                    onClick={getHint}
                    disabled={isLoadingHint || wordChain.length === 0 || isProcessing} // Disable when processing
                    className="w-1/5 bg-purple-600 text-white py-3 px-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isLoadingHint ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      </div>
                    ) : (
                      'Hint'
                    )}
                  </button>
                </div>
                
                {/* Hint Results */}
                {hintData && (
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Hint Suggestions</h4>
                    
                    {hintData.message && hintData.hint === null && (
                      <p className="text-amber-600 dark:text-amber-400 mb-2">{hintData.message}</p>
                    )}
                    
                    {hintData.all_top_candidates && hintData.all_top_candidates.length > 0 ? (
                      <div className="space-y-2">
                        {(() => {
                          const filteredCandidates = hintData.all_top_candidates.filter(candidate => {
                            const candidateWord = candidate.word.toLowerCase();
                            // Filter out words that are:
                            // 1. The current word in the chain
                            // 2. The target word
                            // 3. Already in the word chain
                            return candidateWord !== wordChain[wordChain.length - 1].toLowerCase() && 
                                   candidateWord !== puzzle.endWord.toLowerCase() &&
                                   !wordChain.map(w => w.toLowerCase()).includes(candidateWord);
                          });
                          
                          if (filteredCandidates.length === 0) {
                            return (
                              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                                <p className="font-medium">Best guesses are already in your word chain. It might be best to backtrack.</p>
                              </div>
                            );
                          }
                          
                          return filteredCandidates.map((candidate, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                              <div className="font-medium">{candidate.word}</div>
                              <div className="text-sm">
                                <span className="text-blue-600 dark:text-blue-400 mr-2">
                                  Current: {(candidate.similarity_to_current * 100).toFixed(1)}%
                                </span>
                                <span className="text-green-600 dark:text-green-400">
                                  Target: {(candidate.similarity_to_target * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300">No suitable hints available.</p>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
