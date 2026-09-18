import React from 'react';
import { motion } from 'framer-motion';

const TRENDING_CATEGORIES = [
  {
    id: 'hot-1',
    title: 'CORSET TOPS',
    image: '/assets/Images/Corset04.png',
    link: '#corsets'
  },
  {
    id: 'hot-2',
    title: 'CO-ORD SETS',
    image: '/assets/Images/Brown02.png',
    link: '#coords'
  },
  {
    id: 'hot-3',
    title: 'SUMMER DRESSES',
    image: '/assets/Images/Blue03.png',
    link: '#summer-dresses'
  },
  {
    id: 'hot-4',
    title: 'PARTY WEAR',
    image: '/assets/Images/Peach03.png',
    link: '#party-wear'
  }
];

export const WhatsHot = () => {
  return (
    <section className="py-12 md:py-16 px-4 md:px-8 max-w-[1800px] mx-auto bg-white">
      {/* Section Heading matching CategoryGrid */}
      <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7 text-left">
        <h2 className="section-heading text-brand-dark">
          WHAT'S HOT RN ?
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {TRENDING_CATEGORIES.map((category, idx) => (
          <motion.a
            key={category.id}
            href={category.link}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative block aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-neutral-100"
          >
            <img
              src={category.image}
              alt={category.title}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            {/* Category Text directly over clear image */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
              <h3 
                className="text-white text-2xl md:text-3xl lg:text-4xl font-serif tracking-[0.15em] uppercase font-extrabold leading-tight"
                style={{ textShadow: '0px 2px 8px rgba(0,0,0,0.7), 0px 1px 3px rgba(0,0,0,0.5)' }}
              >
                {category.title.split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {word}
                    <br />
                  </React.Fragment>
                ))}
              </h3>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
};
