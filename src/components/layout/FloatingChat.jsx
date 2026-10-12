import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { UrvaahBot } from '../chatbot/UrvaahBot';

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-urvaah-bot', handleOpen);
    return () => window.removeEventListener('open-urvaah-bot', handleOpen);
  }, []);

  return (
    <>
      {!isOpen && (
        <div
          className="fixed bottom-0 right-0 p-2 z-40 font-serif select-none transition-all duration-300"
          style={{ bottom: '30px', right: '0px' }}
        >
          <button
            onClick={() => setIsOpen(true)}
            data-no-hover="true"
            className="no-global-hover flex items-center gap-2.5 pl-2 pr-4 py-1.5 sm:py-2 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35)] border border-[#C9A66B]/60 transition-all duration-300 group bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#C9A66B] hover:shadow-[0_10px_30px_rgba(201,166,107,0.3)] hover:scale-105 cursor-pointer"
            aria-label="Chat with Urvaah bot"
            title="Chat with Urvaah bot"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A1A1A] border border-[#C9A66B]/50 text-[#C9A66B] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Bot className="w-4 h-4 text-[#C9A66B] stroke-[1.8]" />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A66B] group-hover:text-[#E2C799] transition-colors">
              CHAT
            </span>
          </button>
        </div>
      )}

      <UrvaahBot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default FloatingChat;
