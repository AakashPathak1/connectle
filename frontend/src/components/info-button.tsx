"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function InfoButton() {
  const [isOpen, setIsOpen] = useState(false)

  // Disable background scrolling and interactions when modal is open
  useEffect(() => {
    if (isOpen) {
      // Add a class to the body to handle modal open state
      document.body.classList.add('modal-open')
      
      // Hide all main content elements
      const mainContent = document.querySelector('main') as HTMLElement
      if (mainContent) {
        mainContent.style.visibility = 'hidden'
      }
      
      // Make sure the modal container is visible and interactive
      const modalContainer = document.querySelector('.info-modal-container') as HTMLElement
      if (modalContainer) {
        modalContainer.style.visibility = 'visible'
        modalContainer.style.pointerEvents = 'auto'
      }
    } else {
      // Reset everything when modal closes
      document.body.classList.remove('modal-open')
      
      const mainContent = document.querySelector('main') as HTMLElement
      if (mainContent) {
        mainContent.style.visibility = 'visible'
      }
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open')
      const mainContent = document.querySelector('main') as HTMLElement
      if (mainContent) {
        mainContent.style.visibility = 'visible'
      }
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors shadow-md"
        aria-label="Game information"
      >
        <span className="font-bold text-sm">i</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - prevents interaction with background elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="fixed inset-0 bg-black bg-opacity-90 z-[9998]"
              onClick={() => setIsOpen(false)}
              style={{ pointerEvents: 'all' }}
            />

            {/* Info modal - positioned in the center of the viewport */}
            <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none info-modal-container" style={{ visibility: 'visible' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.08 }}
                className="w-[90%] max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 pointer-events-auto relative z-[10000]"
                style={{ margin: '0 auto' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">How to Play 🎮</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p className="text-base">
                  🎯 <span className="font-semibold">Goal:</span> Build the shortest chain possible to connect the starting and target words.
                </p>
                
                <div>
                  <p className="font-semibold text-base mb-2">📝 Rules:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Each word must be similar to the previous word (50%+ similarity) and be a valid English word</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Use hints 💡 when stuck and backtrack 🔙 if needed</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Watch the similarity meter 📊 to guide your choices</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="mt-5 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Got it! 👍
              </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
