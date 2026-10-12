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
            className="no-global-hover flex items-center gap-2.5 pl-2 pr-4 py-1.5 sm:py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-black/20 hover:border-black transition-all duration-300 group bg-white hover:bg-neutral-50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-105 cursor-pointer"
            aria-label="Chat with Urvaah bot"
            title="Chat with Urvaah bot"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-100 border border-neutral-300/80 text-black flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Bot className="w-4 h-4 text-black stroke-[1.8]" />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-black group-hover:text-neutral-700 transition-colors">
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
