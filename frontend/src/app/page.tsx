'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    axios.get(`${API_URL}/api/daily-puzzle`)
      .then(response => {
        setPuzzle({
          startWord: response.data.start_word,
          endWord: response.data.end_word,
          startDefinition: response.data.start_definition,
          endDefinition: response.data.end_definition
        });
        setWordChain([response.data.start_word]);
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

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord.trim()) return;

    setIsCheckingWord(true);
    setWordError(null);

    try {
      const lastWord = wordChain[wordChain.length - 1];
      const similarity = await checkWordSimilarity(lastWord, currentWord);

      if (similarity > 0.4) {
        setWordChain([...wordChain, currentWord]);
        setCurrentWord('');
        
        // Check if we've reached the end word
        if (currentWord.toLowerCase() === puzzle?.endWord.toLowerCase()) {
          setWordError("Congratulations! You've completed the puzzle! 🎉");
        }
      } else {
        setWordError(`Word not similar enough (${(similarity * 100).toFixed(1)}% similar). Try another word.`);
      }
    } catch (err) {
      console.error('Error checking word similarity:', err);
      setWordError('Error checking word similarity. Please try again.');
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
                <p className="text-gray-600 dark:text-gray-300">{puzzle.startDefinition}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-all hover:shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">End Word</h2>
                <p className="text-3xl mb-4 text-green-600 dark:text-green-400 font-bold">{puzzle.endWord}</p>
                <p className="text-gray-600 dark:text-gray-300">{puzzle.endDefinition}</p>
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
                    type="text"
                    value={currentWord}
                    onChange={(e) => setCurrentWord(e.target.value.toLowerCase())}
                    placeholder="Enter your next word"
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isCheckingWord}
                  />
                </div>

                {wordError && (
                  <div className={`p-3 rounded-lg ${wordError.includes('Congratulations') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
                    {wordError}
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
