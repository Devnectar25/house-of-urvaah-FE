import React from 'react';
// House of Urvaah - Home Page
import { HeroParallaxBlock } from '../components/home/HeroParallaxBlock';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { EditorialBanner } from '../components/home/EditorialBanner';
import { BestSellers } from '../components/home/BestSellers';
import { StealDeals } from '../components/home/StealDeals';
import { TrendingOnGram } from '../components/home/TrendingOnGram';
import { WhatsHot } from '../components/home/WhatsHot';
import { BrandStory } from '../components/home/BrandStory';
import { Newsletter } from '../components/home/Newsletter';
import { AuthSection } from '../components/home/AuthSection';
import { useCart } from '../context/CartContext';

export const Home = () => {
  const { setPdpProduct } = useCart();

  return (
    <main className="w-full min-h-screen bg-white">
      {/* Hero Video + Dual Campaign Banner Parallax Block with Pinned Logo Overlay */}
      <HeroParallaxBlock />

      {/* BEST SELLERS Section */}
      <section id="best-sellers" className="scroll-mt-20">
        <BestSellers onQuickView={(p) => setPdpProduct(p)} />
      </section>

      {/* STEAL DEALS Section */}
      <StealDeals />

      {/* TRENDING ON THE GRAM Section */}
      <section id="trending" className="scroll-mt-20">
        <div id="trending-on-gram" />
        <TrendingOnGram />
      </section>

      {/* WHAT'S HOT RN Section */}
      <section id="whats-hot" className="scroll-mt-20">
        <WhatsHot />
      </section>

      {/* 4.4 Category Grid / Shop by Category */}
      <section id="recommended" className="scroll-mt-20">
        <div id="recommended-for-you" />
        <CategoryGrid />
      </section>

      {/* 4.6 Editorial/Lookbook Banner */}
      <EditorialBanner />

      {/* 4.8 Sustainability / Brand Story Strip */}
      <BrandStory />

      {/* Login & Sign Up Atelier Section */}
      <AuthSection />

      {/* 4.9 Newsletter Signup */}
      <Newsletter />
    </main>
  );
};
