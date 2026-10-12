import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../../lib/apiClient';
import { getSupabaseMediaUrl } from '../../lib/supabase';

const DEFAULT_CATEGORIES = [
  {
    id: 'hot-1',
    anchorId: 'corset-tops',
    title: 'CORSET TOPS',
    image: '/assets/Images/Corset04.png',
    link: '/category/corset-tops'
  },
  {
    id: 'hot-2',
    anchorId: 'co-ord-sets',
    title: 'CO-ORD SETS',
    image: '/assets/Images/Brown02.png',
    link: '/category/co-ord-sets'
  },
  {
    id: 'hot-3',
    anchorId: 'kurti',
    title: 'KURTI',
    image: '/assets/Images/Peach01.png',
    link: '/category/kurti'
  },
  {
    id: 'hot-4',
    anchorId: 'party-wear',
    title: 'PARTY WEAR',
    image: '/assets/Images/Brown01.png',
    link: '/category/party-wear'
  }
];

export const WhatsHot = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const fetchCategories = async () => {
    try {
      const res = await apiClient('/api/categories/active');
      const list = Array.isArray(res) ? res : (res?.data || res?.data?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((cat, idx) => {
          const rawName = cat.name || cat.title || `Category ${idx + 1}`;
          const anchorId = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
          const rawImg = cat.category_image || cat.image_url || cat.image || '';
          
          return {
            id: cat.id || cat.category_id || `cat-${idx}`,
            anchorId: anchorId || `cat-${idx}`,
            title: rawName.toUpperCase(),
            image: rawImg ? getSupabaseMediaUrl(rawImg) : '/assets/Images/Brown02.png',
            link: `/category/${anchorId}`
          };
        });
        setCategories(mapped);
      }
    } catch (err) {
      console.warn('[WhatsHot] Failed to fetch live categories:', err.message);
    }
  };

  useEffect(() => {
    fetchCategories();

    // Event listeners for instant live updates when Admin creates/edits categories
    const handleUpdate = () => fetchCategories();
    window.addEventListener('urvaah_categories_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Continuous polling interval for seamless multi-tab / session synchronization
    const interval = setInterval(fetchCategories, 3000);

    return () => {
      window.removeEventListener('urvaah_categories_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="pt-12 md:pt-16 pb-0 px-4 md:px-8 max-w-[1800px] mx-auto bg-white">
      {/* Section Heading matching CategoryGrid */}
      <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7 text-left">
        <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark">
          WHAT'S HOT RN ?
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {categories.map((category, idx) => (
          <motion.div
            key={category.id}
            id={category.anchorId}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative block aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-neutral-100"
          >
            <Link
              to={category.link}
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="block w-full h-full relative cursor-pointer"
            >
              <img
                src={category.image}
                alt={category.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/Images/Brown02.png';
                }}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              {/* Category Text directly over clear image */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 transition-colors group-hover:bg-black/10">
                <h3 
                  className="text-white text-2xl md:text-3xl lg:text-4xl font-serif tracking-[0.15em] uppercase font-extrabold leading-tight transition-transform duration-300 group-hover:scale-105"
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
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default WhatsHot;

