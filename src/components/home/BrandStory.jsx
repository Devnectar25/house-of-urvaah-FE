import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, ShieldCheck, RefreshCw, Feather } from 'lucide-react';

export const BrandStory = () => {
  const pillars = [
    {
      icon: Leaf,
      title: 'ORGANIC MATERIALS',
      description: '100% GOTS-certified organic cotton, French linen, and traceable virgin wool.',
    },
    {
      icon: Feather,
      title: 'ZERO-WASTE TAILORING',
      description: 'Precision laser cutting technology minimizing raw textile waste by up to 94%.',
    },
    {
      icon: ShieldCheck,
      title: 'ETHICAL CRAFTSMANSHIP',
      description: 'Partnering exclusively with certified European artisanal ateliers ensuring fair wages.',
    },
    {
      icon: RefreshCw,
      title: 'CIRCULAR DESIGN',
      description: 'Garments crafted to endure generations with free lifetime repair service.',
    },
  ];

  return (
    <section className="py-20 bg-brand-sand/60 border-t border-b border-neutral-200/80 font-serif text-brand-dark">
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto mb-16 md:mb-20"
        >
          <span className="text-[10px] tracking-[0.35em] text-neutral-400 font-serif uppercase block mb-2">
            PHILOSOPHY — JOIN LIFE
          </span>
          <h2 className="section-heading-lg font-serif tracking-[0.1em] text-brand-dark mb-5 md:mb-6">
            REFINED WITH CONSCIENCE
          </h2>
          <p className="text-xs md:text-sm text-neutral-600 tracking-wider font-light leading-relaxed">
            House of Uraah stands at the intersection of modern architectural fashion and responsible environmental stewardship. Every collection is produced in small, intentional batches.
          </p>
        </motion.div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white p-8 border border-neutral-200/60 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-brand-sand flex items-center justify-center text-brand-dark mb-6">
                    <Icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-[0.2em] uppercase mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-neutral-500 tracking-wider font-light leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12">
          <a
            href="#our-story"
            className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-brand-dark border-b border-black pb-1 hover:text-neutral-500 hover:border-neutral-400 transition-colors"
          >
            READ OUR FULL SUSTAINABILITY MANIFESTO →
          </a>
        </div>
      </div>
    </section>
  );
};
