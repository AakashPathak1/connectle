"use client"

import { trackUIEvents } from "@/utils/analytics"

interface FeedbackLinkProps {
  email: string
}

export default function FeedbackLink({ email }: FeedbackLinkProps) {
  const handleClick = () => {
    // Track feedback link click
    trackUIEvents.clickFeedback();
  }

  return (
    <div className="fixed bottom-2 right-2 z-50">
      <a 
        href={`mailto:${email}?subject=Connectle Feedback`}
        onClick={handleClick}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
      >
        Feedback?
      </a>
    </div>
  )
}
