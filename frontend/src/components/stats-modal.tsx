"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ConfettiExplosion from "./confetti-explosion"
import { trackUIEvents } from "../utils/analytics"

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
  wordChain: string[]
  hintsUsed: number
  startWord: string
  endWord: string
  showConfetti?: boolean
  lockGame?: () => void
}

export default function StatsModal({ 
  isOpen, 
  onClose, 
  wordChain, 
  hintsUsed,
  startWord,
  endWord,
  showConfetti = true,
  lockGame
}: StatsModalProps) {
  // State to track if copy notification is visible
  const [copyNotificationVisible, setCopyNotificationVisible] = useState(false)
  // Calculate chain length (total number of words in the chain)
  const chainLength = wordChain.length // Count all words in the chain

  // Disable background scrolling and interactions when modal is open
  useEffect(() => {
    console.log('StatsModal isOpen:', isOpen)
    console.log('Word chain:', wordChain)
    console.log('Hints used:', hintsUsed)
    
    if (isOpen) {
      // Track stats modal view
      trackUIEvents.viewRules();
      console.log('Initializing stats modal...')
      // Add classes to the body to handle modal open state
      document.body.classList.add('modal-open')
      document.body.classList.add('stats-modal-open')
      
      // Hide all main content elements
      const mainContent = document.querySelector('main') as HTMLElement
      if (mainContent) {
        mainContent.style.visibility = 'hidden'
      }
      
      // Make sure the modal container is visible and interactive
      let modalContainer = document.querySelector('.stats-modal-container') as HTMLElement
      
      // If the container doesn't exist yet, we need to wait for it to be rendered
      if (!modalContainer) {
        console.log('Modal container not found, waiting for render...');
        // Use a short timeout to allow the component to render
        setTimeout(() => {
          modalContainer = document.querySelector('.stats-modal-container') as HTMLElement;
          if (modalContainer) {
            console.log('Modal container found after delay');
            modalContainer.style.visibility = 'visible';
            modalContainer.style.pointerEvents = 'auto';
          } else {
            console.error('Modal container still not found after delay');
          }
        }, 100);
      } else {
        console.log('Modal container found immediately');
        modalContainer.style.visibility = 'visible';
        modalContainer.style.pointerEvents = 'auto';
      }
    } else {
      console.log('Closing stats modal...')
      // Reset everything when modal closes
      document.body.classList.remove('modal-open')
      document.body.classList.remove('stats-modal-open')
      
      const mainContent = document.querySelector('main') as HTMLElement
      if (mainContent) {
        mainContent.style.visibility = 'visible'
      }
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open')
      document.body.classList.remove('stats-modal-open')
      const mainContent = document.querySelector('main') as HTMLElement
      if (mainContent) {
        mainContent.style.visibility = 'visible'
      }
    }
  }, [isOpen, wordChain, hintsUsed])

  // Function to copy stats to clipboard without word chain
  const copyToClipboardWithoutChain = () => {
    // Get today's date in the format MM/DD/YYYY
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    const statsText = `Connectle (${formattedDate})
🔗 ${startWord} → ${endWord}
🔄 Chain: ${chainLength} words
💡 Hints: ${hintsUsed}
Play at connectle-game.vercel.app`;

    // Track share event
    trackUIEvents.shareGame('clipboard', { startWord, endWord, includesChain: false });

    navigator.clipboard.writeText(statsText)
      .then(() => {
        // Show the copy notification
        setCopyNotificationVisible(true);
        
        // Hide it after 1 second
        setTimeout(() => {
          setCopyNotificationVisible(false);
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to copy stats: ', err);
      });
  };

  // Function to copy stats to clipboard with word chain
  const copyToClipboardWithChain = () => {
    // Get today's date in the format MM/DD/YYYY
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    const wordChainText = wordChain.join(' → ');
    const statsText = `Connectle (${formattedDate})
🔗 ${startWord} → ${endWord}
🔄 Chain: ${chainLength} words
📋 Path: ${wordChainText}
💡 Hints: ${hintsUsed}
Play at connectle-game.vercel.app`;

    // Track share event
    trackUIEvents.shareGame('clipboard', { startWord, endWord, includesChain: true });

    navigator.clipboard.writeText(statsText)
      .then(() => {
        // Show the copy notification
        setCopyNotificationVisible(true);
        
        // Hide it after 1 second
        setTimeout(() => {
          setCopyNotificationVisible(false);
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to copy stats: ', err);
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - prevents interaction with background elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-[99998]"
            onClick={onClose}
            style={{ pointerEvents: 'all' }}
          />

          {/* Show confetti over the modal */}
          {showConfetti && <ConfettiExplosion />}
          
          {/* Stats modal - positioned in the center of the viewport */}
          <div className="fixed inset-0 flex items-center justify-center z-[99999] pointer-events-none stats-modal-container" style={{ visibility: 'visible', zIndex: 99999 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.08 }}
              className="w-[90%] max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 pointer-events-auto relative z-[100000]"
              style={{ margin: '0 auto' }}
            >
              <div className="flex justify-center items-center mb-4">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Game Complete! 🎉</h3>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                    <p className="text-xl font-semibold">🔄 {chainLength}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Words</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                    <p className="text-xl font-semibold">💡 {hintsUsed}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hints Used</p>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <p className="font-semibold text-base mb-2">📋 Your Path:</p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg overflow-x-auto">
                    <p className="text-sm leading-relaxed whitespace-nowrap">
                      {wordChain.map((word, index) => (
                        <span key={index}>
                          <span className="font-medium">{word}</span>
                          {index < wordChain.length - 1 && (
                            <span className="mx-1 text-gray-400">→</span>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 space-y-3 relative">
                {/* Copy notification with animation */}
                <motion.div 
                  className="absolute -top-10 left-0 right-0 text-center text-green-500 font-medium bg-green-100 py-2 px-4 rounded-md mx-auto w-max"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: copyNotificationVisible ? 1 : 0, 
                    y: copyNotificationVisible ? 0 : 10 
                  }}
                  transition={{ duration: 0.2 }}
                >
                  Copied to clipboard! ✓
                </motion.div>
                
                {/* Copy buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboardWithoutChain}
                    className="flex-[6] py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Stats
                  </button>
                  <button
                    onClick={copyToClipboardWithChain}
                    className="flex-[4] py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Chain
                  </button>
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => {
                    // Lock the game when closing the modal
                    if (lockGame) {
                      console.log('Locking game from modal close button');
                      lockGame();
                    }
                    onClose();
                  }}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
                
                {/* Feedback link */}
                <div className="mt-4 text-center">
                  <a 
                    href="mailto:aakashpathak@berkeley.edu?subject=Connectle Feedback"
                    onClick={() => trackUIEvents.clickFeedback()}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                  >
                    Feedback?
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
