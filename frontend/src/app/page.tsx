'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Puzzle {
  startWord: string;
  endWord: string;
  startDefinition: string;
  endDefinition: string;
}

const API_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : '';

export default function Home() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/daily-puzzle`)
      .then(response => {
        setPuzzle({
          startWord: response.data.start_word,
          endWord: response.data.end_word,
          startDefinition: response.data.start_definition,
          endDefinition: response.data.end_definition
        });
      })
      .catch(error => {
        setError("Failed to load puzzle. Please try again.");
        console.error("Error:", error);
      })
      .finally(() => setIsLoading(false));
  }, []);

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
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
        ) : null}
      </main>
    </div>
  );
}
