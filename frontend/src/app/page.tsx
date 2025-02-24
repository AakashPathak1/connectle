'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Puzzle {
  startWord: string;
  endWord: string;
  startDefinition: string;
  endDefinition: string;
}

const API_URL = 'http://localhost:5001';  // Always use localhost in development
const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || 'https://aakashpathak-connectle-huggingface.hf.space';

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
    axios.get(`${API_URL}/api/daily-puzzle`)
      .then(response => {
        setPuzzle({
          startWord: response.data.startWord,
          endWord: response.data.endWord,
          startDefinition: response.data.startDefinition,
          endDefinition: response.data.endDefinition
        });
        setWordChain([response.data.startWord]);
      })
      .catch(error => {
        setError("Failed to load puzzle. Please try again.");
        console.error("Error:", error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const checkWordSimilarity = async (word1: string, word2: string) => {
    try {
      const response = await axios.get(`${HF_SPACE_URL}/check-similarity`, {
        params: { word1, word2 }
      });
      return response.data.similarity;
    } catch (error) {
      console.error('Error checking word similarity:', error);
      throw error;
    }
  };

  const isEnglishWord = async (word: string) => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      return response.ok;
    } catch (error) {
      console.error('Error checking word:', error);
      return false;
    }
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord.trim()) return;

    setIsCheckingWord(true);
    setWordError(null);
    setInvalidWord(false);

    const normalizedWord = currentWord.toLowerCase().trim();
    
    // Check if word is already in chain
    if (wordChain.map(w => w.toLowerCase()).includes(normalizedWord)) {
      setInvalidWord(true);
      setWordError('Word already used in chain');
      setIsCheckingWord(false);
      setShouldFocus(true);
      return;
    }

    // Check if it's a valid English word
    const isValid = await isEnglishWord(normalizedWord);
    if (!isValid) {
      setInvalidWord(true);
      setIsCheckingWord(false);
      setShouldFocus(true);
      return;
    }

    try {
      const lastWord = wordChain[wordChain.length - 1].toLowerCase();
      const similarity = await checkWordSimilarity(lastWord, normalizedWord);

      setLastSimilarity(similarity);
      if (similarity > 0.5) {
        setInvalidWord(false);
        setWordChain([...wordChain, normalizedWord]);
        setCurrentWord('');
        setShouldFocus(true);
        
        // Check if we've reached the end word
        if (normalizedWord === puzzle?.endWord.toLowerCase()) {
          setWordError("Congratulations! You've completed the puzzle! 🎉");
        }
      } else {
        setWordError(`Word not similar enough (${(similarity * 100).toFixed(1)}% similar). Try another word.`);
        setShouldFocus(true);
      }
    } catch (err) {
      console.error('Error checking word similarity:', err);
      setWordError('Error checking word similarity. Please try again.');
      setShouldFocus(true);
    } finally {
      setIsCheckingWord(false);
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
                    disabled={isCheckingWord}
                  />
                </div>

                {(wordError || lastSimilarity !== null) && (
                  <div className="space-y-2">
                    {(lastSimilarity !== null || invalidWord) && (
                      <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                        {invalidWord ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            Not a valid English word
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
                    {wordError && (
                      <div className={`p-3 rounded-lg ${wordError.includes('Congratulations') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
                        {wordError}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCheckingWord || !currentWord.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCheckingWord ? 'Checking...' : 'Submit Word'}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
