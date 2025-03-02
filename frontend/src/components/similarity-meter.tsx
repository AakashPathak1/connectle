"use client"

import { motion } from "framer-motion"

interface SimilarityMeterProps {
  similarity: number
  threshold: number
  showPercentage?: boolean
  height?: number
  className?: string
}

export default function SimilarityMeter({
  similarity,
  threshold = 0.47,
  showPercentage = false,
  height = 8,
  className = ""
}: SimilarityMeterProps) {
  // Normalize the similarity value (47% becomes 50%)
  const normalizedSimilarity = Math.min(Math.max(similarity, 0), 1);
  
  // Scale factor to convert actual threshold (0.47) to displayed threshold (0.50)
  const scaleFactor = 0.50 / 0.47;
  
  // Apply the scaling to get the display value (capped at 100%)
  const displaySimilarity = Math.min(normalizedSimilarity * scaleFactor, 1);
  
  const isAboveThreshold = normalizedSimilarity >= threshold;
  
  // Calculate color gradient from red to yellow to green
  const getColor = (value: number) => {
    // Red to yellow to green gradient
    if (value < threshold) {
      // Red to yellow (0 to threshold)
      const ratio = value / threshold;
      return `rgb(255, ${Math.floor(255 * ratio)}, 0)`;
    } else {
      // Yellow to green (threshold to 1)
      const ratio = (value - threshold) / (1 - threshold);
      return `rgb(${Math.floor(255 * (1 - ratio))}, 255, 0)`;
    }
  };

  // Get background color for the meter
  const backgroundColor = getColor(normalizedSimilarity);
  
  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={{ height: `${height}px` }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ 
            backgroundColor,
            width: `${displaySimilarity * 100}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${displaySimilarity * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        
        {/* Threshold marker */}
        <div 
          className="absolute -top-1 h-[calc(100%+8px)] w-1 bg-black dark:bg-black z-10 shadow-[0_0_2px_1px_rgba(0,0,0,0.3)] dark:shadow-[0_0_2px_1px_rgba(0,0,0,0.7)]"
          style={{ left: `${threshold * 100}%` }}
        />
      </div>
      
      {showPercentage && (
        <div className="mt-1 text-xs flex justify-between">
          <span className={isAboveThreshold ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
            {(displaySimilarity * 100).toFixed(1)}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            Threshold: 50%
          </span>
        </div>
      )}
    </div>
  )
}
