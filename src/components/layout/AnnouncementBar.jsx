import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANNOUNCEMENTS } from '../../data/mockProducts';

export const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-brand-dark text-brand-light text-[10px] sm:text-xs tracking-[0.2em] font-medium uppercase py-2 px-4 relative z-40 overflow-hidden text-center select-none border-b border-white/10">
      <div className="h-4 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-x-0 text-center font-normal tracking-[0.25em]"
          >
            {ANNOUNCEMENTS[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
