import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BEST_SELLERS_PRODUCTS } from '../../data/mockProducts';
import { ProductCard } from '../common/ProductCard';
import { productApi } from '../../services/productApi';

export const BestSellers = ({ onQuickView }) => {
  const [products, setProducts] = useState(BEST_SELLERS_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    productApi.getFeaturedProducts()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((err) => {
        console.warn('Using fallback best sellers:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <section id="best-sellers" className="py-16 md:py-20 bg-white font-serif scroll-mt-20">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        {/* Section Heading */}
        <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7">
          <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif block mb-1">
            CURATED ESSENTIALS
          </span>
          <h2 className="section-heading font-serif tracking-[0.2em] text-brand-dark">
            BEST SELLERS
          </h2>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <ProductCard product={product} onQuickView={onQuickView} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
