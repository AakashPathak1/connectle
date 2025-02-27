'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import ConnectleGame from '@/components/connectle-game';
import ConnectleLogo from '@/components/connectle-logo';

interface Puzzle {
  startWord: string;
  endWord: string;
  startDefinition: string;
  endDefinition: string;
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

  useEffect(() => {
    fetchPuzzle();
  }, []);

  const fetchPuzzle = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/daily-puzzle`);
      setPuzzle(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);
      setError("Failed to load puzzle. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          className="flex flex-col items-center justify-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ConnectleLogo className="w-16 h-16 mb-4" />
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white">
            Connectle
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center max-w-md">
            Connect words one step at a time. Each word must be similar to the previous one.
          </p>
        </motion.div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : error ? (
          <motion.div 
            className="text-center text-red-500 p-6 bg-red-100 dark:bg-red-900/20 rounded-lg max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-medium mb-4">{error}</p>
            <button
              onClick={fetchPuzzle}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        ) : puzzle ? (
          <ConnectleGame 
            apiBaseUrl={API_BASE_URL}
            puzzle={puzzle}
            onError={setError}
          />
        ) : null}
      </main>
    </div>
  );
}
