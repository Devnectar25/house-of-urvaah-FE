import React from 'react';
// House of Urvaah - Home Page
import { SEOHead } from '../components/common/SEOHead';
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

// Flag to control visibility of the "PRICE DROP ERA" (StealDeals) section on the homepage
const SHOW_PRICE_DROP_ERA = false;

export const Home = () => {
  const { setPdpProduct } = useCart();

  return (
    <main className="w-full min-h-screen bg-white">
      <SEOHead 
        title="House of Urvaah | Official Online Store & Luxury Atelier"
        description="Explore House of Urvaah: high-fashion runway tailoring, luxury silk dresses, minimalist co-ord sets, and timeless women's designer apparel."
        keywords="House of Urvaah, luxury clothing, architectural tailoring, silk dresses, co-ord sets, women fashion atelier"
        ogImage="/assets/Images/Brown01.png"
      />
      {/* Hero Video + Dual Campaign Banner Parallax Block with Pinned Logo Overlay */}
      <HeroParallaxBlock />

      {/* BEST SELLERS Section */}
      <section id="best-sellers" className="scroll-mt-20">
        <BestSellers onQuickView={(p) => setPdpProduct(p)} />
      </section>

      {/* STEAL DEALS / PRICE DROP ERA Section */}
      {SHOW_PRICE_DROP_ERA && <StealDeals />}

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
