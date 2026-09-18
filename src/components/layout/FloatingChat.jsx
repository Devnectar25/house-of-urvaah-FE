import React from 'react';
import { MessageCircle } from 'lucide-react';

export const FloatingChat = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40 font-serif select-none">
      <button
        onClick={() => alert('Customer Assistance Chat mock window opened!')}
        className="flex items-center gap-2 bg-white text-brand-dark px-4 py-2.5 rounded-full shadow-lg border border-black/10 hover:bg-neutral-100 hover:shadow-xl transition-all duration-300 group"
        aria-label="Open Customer Chat"
      >
        <MessageCircle className="w-4 h-4 stroke-[1.8] text-brand-dark group-hover:scale-110 transition-transform" />
        <span className="text-[11px] font-semibold tracking-widest uppercase text-brand-dark">
          CHAT
        </span>
      </button>
    </div>
  );
};
