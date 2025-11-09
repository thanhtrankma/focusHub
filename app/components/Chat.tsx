'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isTyping?: boolean;
}

const messages: string[] = [
  "Welcome to FocusHub! Let's start a productive study session together. 🚀",
  "Remember to take breaks and stay hydrated. Your focus is your superpower! 💪",
  "You're doing great! Keep pushing forward, one task at a time. ✨",
  "Take a moment to breathe. You've got this! 💙",
];

export default function Chat() {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // Reset when we've shown all messages
    if (currentMessageIndex >= messages.length) {
      // Clear old messages and restart from beginning
      setTimeout(() => {
        setDisplayedMessages([]);
        setCurrentMessageIndex(0);
      }, 2000);
      return;
    }

    const message = messages[currentMessageIndex];
    setIsTyping(true);
    setDisplayedText('');

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < message.length) {
        setDisplayedText(message.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        // Add completed message to displayed messages
        setDisplayedMessages((prev) => [
          ...prev,
          { id: Date.now() + currentMessageIndex, text: message },
        ]);

        // Wait before showing next message
        setTimeout(() => {
          setCurrentMessageIndex((prev) => prev + 1);
        }, 2000);
      }
    }, 50); // Typing speed: 50ms per character

    return () => clearInterval(typingInterval);
  }, [currentMessageIndex]);

  return (
    <div className="w-full max-w-md space-y-4">
      <h2 className="text-2xl font-semibold text-slate-200 mb-4">Study Chat</h2>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {displayedMessages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
              F
            </div>
            <div className="flex-1">
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700">
                <p className="text-slate-200 text-sm leading-relaxed">
                  {msg.text}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
              F
            </div>
            <div className="flex-1">
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700">
                <p className="text-slate-200 text-sm leading-relaxed">
                  {displayedText}
                  <span className="inline-block w-2 h-4 bg-teal-400 ml-1 animate-pulse">|</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

