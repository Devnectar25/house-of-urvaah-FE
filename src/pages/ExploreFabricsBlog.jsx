import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Feather,
  Sun,
  Crown,
  ArrowRight,
  Check,
  Share2,
  BookOpen,
  Heart,
  ChevronRight,
  ShieldCheck,
  Clock,
  Compass,
  Layers,
  Sparkle
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';

export const ExploreFabricsBlog = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Reading progress scroll indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: 'Choosing the Right Fabric for Ethnic Wear | House of Urvaah',
      text: 'Explore our master guide to ethnic fabrics: Sequin Embroidery, Cora Cotton, and Raw Tissue Silk.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.warn('Copy link error:', err);
      }
    }
  };

  const fabrics = [
    {
      id: 'sequin-embroidery',
      number: '01',
      title: 'Embroidered Fabric with Sequin Detailing',
      tagline: 'Subtle Glamour & Refined Festive Detailing',
      badge: 'Festive & Celebration',
      icon: Sparkles,
      image: '/assets/Images/fabrics/sequin-embroidery.jpg',
      imageAlt: 'Embroidered fabric with delicate sequin detailing by House of Urvaah',
      bestFor: 'Festive wear, celebrations, and elegant occasion outfits.',
      description:
        'For women who love subtle glamour, embroidered fabric with sequin detailing is a beautiful choice. Delicate embroidery paired with shimmering sequins adds texture, dimension, and a refined festive appeal to an outfit.',
      stylingNotes:
        'This fabric is ideal for festive gatherings, evening celebrations, and special occasions where elegant detailing makes all the difference. Pair it with minimal jewellery and understated accessories to let the embroidery shine.',
      sensoryProfile: [
        { label: 'Texture', value: 'Embossed & Tactile' },
        { label: 'Sheen', value: 'Luminous Micro-Shimmer' },
        { label: 'Drape', value: 'Graceful & Flowing' },
        { label: 'Occasion', value: 'Evening & Festive' }
      ],
      highlights: [
        'Fine tonal threadwork with artisan-stitched sequins',
        'Reflects soft ambient lighting without overpowering',
        'Adds dimensional depth to silhouette contours'
      ],
      collectionLink: '/clothing',
      ctaText: 'SHOP FESTIVE EMBROIDERY'
    },
    {
      id: 'cora-cotton',
      number: '02',
      title: 'Cora Cotton with Cotton Lining',
      tagline: 'Breathable Ease Meets Everyday Sophistication',
      badge: 'Daytime & Everyday Luxury',
      icon: Feather,
      image: '/assets/Images/fabrics/cora-cotton.jpg',
      imageAlt: 'Pure breathable Cora cotton with soft cotton lining by House of Urvaah',
      bestFor: 'Everyday wear, daytime outings, and comfortable ethnic outfits.',
      description:
        'Comfort and elegance go hand in hand with Cora cotton fabric. Known for its breathable feel, Cora cotton is a practical choice for women who appreciate comfort throughout the day.',
      stylingNotes:
        'The addition of a cotton lining offers an extra layer of comfort, making this combination suitable for everyday ethnic wear, casual outings, and daytime occasions. Its simple, versatile appeal makes it easy to style with minimal jewellery, flats, or your favourite everyday accessories.',
      sensoryProfile: [
        { label: 'Texture', value: 'Organic Crisp Weave' },
        { label: 'Sheen', value: 'Natural Matte Finish' },
        { label: 'Drape', value: 'Structured & Airy' },
        { label: 'Occasion', value: 'Daily, Office & Brunches' }
      ],
      highlights: [
        '100% natural breathable Cora cotton fibers',
        'Hypoallergenic dual-layer cotton lining for non-sheer comfort',
        'Effortlessly stays fresh in humid and warm climates'
      ],
      collectionLink: '/clothing',
      ctaText: 'SHOP CORA COTTON ESSENTIALS'
    },
    {
      id: 'raw-tissue-silk',
      number: '03',
      title: 'Raw Tissue Silk with Gold Zari Hand Embroidery and Sequins',
      tagline: 'Imperial Heritage Craftsmanship & Royal Sheen',
      badge: 'Weddings & High Occasions',
      icon: Crown,
      image: '/assets/Images/fabrics/raw-tissue-silk.jpg',
      imageAlt: 'Raw tissue silk with gold zari hand embroidery and sequins by House of Urvaah',
      bestFor: 'Wedding celebrations, festive occasions, and statement ethnic wear.',
      description:
        'For a rich and graceful look, raw tissue silk with gold zari hand embroidery and sequin detailing brings together traditional craftsmanship and contemporary elegance.',
      stylingNotes:
        'The distinctive texture of raw tissue silk creates a refined visual appeal, while gold zari embroidery adds a traditional touch. Sequin detailing enhances the design with a subtle shimmer, making this fabric a beautiful option for weddings, festive celebrations, and special occasions. Style it with gold jewellery and elegant footwear for a timeless ethnic look.',
      sensoryProfile: [
        { label: 'Texture', value: 'Crisp Metallic Weave' },
        { label: 'Sheen', value: 'Radiant Gold Luster' },
        { label: 'Drape', value: 'Sculptural & Regal' },
        { label: 'Occasion', value: 'Weddings & Royal Galas' }
      ],
      highlights: [
        'Authentic metallic zari thread hand-embroidery by master karigars',
        'Signature crisp body that holds sculptural silhouettes flawlessly',
        'Interplay of gold zari and micro-sequins for heirloom beauty'
      ],
      collectionLink: '/clothing',
      ctaText: 'EXPLORE TISSUE SILK COUTURE'
    }
  ];

  const quickGuidePills = [
    {
      title: 'Festive Glamour',
      fabric: 'Embroidered Sequin Fabric',
      description: 'Opt for dimensional threadwork with subtle reflective shimmer for celebratory gatherings.',
      targetId: 'sequin-embroidery',
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    {
      title: 'Everyday Comfort',
      fabric: 'Breathable Cora Cotton',
      description: 'Choose airy Cora cotton with dual-layer cotton lining for all-day daytime ease.',
      targetId: 'cora-cotton',
      badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200'
    },
    {
      title: 'Luxurious Occasions',
      fabric: 'Raw Tissue Silk with Gold Zari',
      description: 'Make a timeless statement with shimmering gold zari embroidery on raw tissue silk.',
      targetId: 'raw-tissue-silk',
      badgeBg: 'bg-yellow-50 text-yellow-950 border-yellow-300'
    }
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <article className="min-h-screen bg-[#FCFBF8] text-[#111111] font-serif pt-28 sm:pt-32 md:pt-36 pb-24 selection:bg-[#111111] selection:text-white">
      <SEOHead
        title="Choosing the Right Fabric for Ethnic Wear: Comfort Meets Elegance | House of Urvaah"
        description="Discover the complete fabric guide for ethnic wear by House of Urvaah. Compare embroidered sequin fabric, breathable Cora cotton with lining, and royal raw tissue silk with gold zari."
        keywords="Ethnic wear fabrics, Cora cotton with lining, Raw tissue silk with gold zari, embroidered sequin fabric, ethnic clothing fabrics guide, House of Urvaah textile artistry"
        ogImage="/assets/Images/fabrics/fabric-hero.jpg"
      />

      {/* Top Animated Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4AF37] via-[#111111] to-[#D4AF37] z-50 origin-left"
        style={{ scaleX }}
      />

      {/* ── BREADCRUMBS & EDITORIAL METADATA ── */}
      <div className="max-w-[1300px] mx-auto px-6 sm:px-10 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-neutral-200/70 text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-sans">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2">
            <Link to="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-neutral-400">Atelier Journal</span>
            <span>/</span>
            <span className="text-[#111111] font-semibold">Fabric Information</span>
          </nav>

          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              4 Min Read
            </span>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer select-none"
              title="Share this article"
              type="button"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ARTICLE HEADER ── */}
      <header className="max-w-[1100px] mx-auto px-6 sm:px-10 text-center mb-12 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-neutral-300 bg-white/80 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-700 font-sans">
            <Compass className="w-3 h-3 text-[#D4AF37]" />
            House of Urvaah Fabric Journal
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-[0.03em] uppercase text-[#111111] leading-[1.15] mb-5">
            Choosing the Right Fabric for Ethnic Wear: <span className="italic block mt-1 font-light normal-case">Comfort Meets Elegance</span>
          </h1>

          <div className="w-16 h-[1.5px] bg-[#D4AF37] mx-auto mb-5" />

          <p className="text-base sm:text-lg md:text-xl font-serif text-neutral-700 tracking-wide font-light max-w-2xl mx-auto leading-relaxed">
            Types of Fabrics for Ethnic Wear: Cotton, Sequins & Zari Silk
          </p>
        </motion.div>
      </header>

      {/* ── CINEMATIC HERO IMAGE ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 mb-16 sm:mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative rounded-sm overflow-hidden shadow-2xl bg-neutral-100 border border-neutral-200/80 aspect-[16/9] md:aspect-[21/9]"
        >
          <img
            src="/assets/Images/fabrics/fabric-hero.jpg"
            alt="Atelier drape of pure ethnic couture fabrics in House of Urvaah workshop"
            className="w-full h-full object-cover object-center filter brightness-[0.97]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 right-6 sm:right-12 text-white">
            <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#E5D3A3] font-sans font-medium block mb-2">
              Atelier Textile Artistry
            </span>
            <p className="text-xs sm:text-base md:text-lg font-serif italic max-w-xl text-neutral-100">
              "Every thread holds a story; every weave shapes modern femininity."
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── INTRODUCTORY NARRATIVE & QUICK JUMP MATRIX ── */}
      <section className="max-w-[960px] mx-auto px-6 sm:px-10 mb-16 sm:mb-20">
        <div className="bg-white p-8 sm:p-12 md:p-14 border border-neutral-200/90 shadow-sm rounded-sm">
          <p className="text-base sm:text-lg md:text-xl leading-relaxed text-neutral-800 font-light font-serif mb-6 first-letter:text-5xl first-letter:font-normal first-letter:mr-3 first-letter:float-left first-letter:text-[#111111]">
            Choosing the right fabric is what makes an outfit truly special. From breathable cotton for everyday elegance to shimmering sequins and luxurious silk for festive occasions, each fabric brings its own charm. At House of Urvaah, thoughtful fabric choices and refined detailing come together to create styles that celebrate modern femininity.
          </p>
          <p className="text-sm sm:text-base text-neutral-600 font-sans tracking-wide leading-relaxed border-t border-neutral-100 pt-6">
            In this guide, discover three beautiful fabrics for ethnic wear and what makes each one unique.
          </p>

          {/* Quick jump navigation pills */}
          <div className="mt-8 pt-6 border-t border-neutral-200/70">
            <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-sans block mb-4">
              Explore in This Guide:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fabrics.map((fabric) => (
                <button
                  key={fabric.id}
                  onClick={() => scrollToSection(fabric.id)}
                  className="flex items-center justify-between p-3.5 text-left border border-neutral-200 hover:border-[#111111] bg-[#FAF9F6] hover:bg-white transition-all group cursor-pointer"
                  type="button"
                >
                  <div>
                    <span className="text-[10px] text-[#D4AF37] font-sans font-semibold tracking-wider block">
                      PART {fabric.number}
                    </span>
                    <span className="text-xs font-serif font-medium text-neutral-800 group-hover:text-black line-clamp-1">
                      {fabric.title}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 DETAILED FABRIC CARDS (EDITORIAL LAYOUT) ── */}
      <section className="max-w-[1300px] mx-auto px-6 sm:px-10 space-y-24 sm:space-y-32 mb-24">
        {fabrics.map((fabric, index) => {
          const isEven = index % 2 === 1;
          const IconComponent = fabric.icon;

          return (
            <motion.section
              key={fabric.id}
              id={fabric.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="scroll-mt-36"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                {/* Visual Column */}
                <div className={`lg:col-span-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative group overflow-hidden border border-neutral-200/90 shadow-lg rounded-sm bg-neutral-100">
                    <img
                      src={fabric.image}
                      alt={fabric.imageAlt}
                      className="w-full aspect-[4/3] object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Badge Overlay */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 border border-neutral-200 shadow-sm">
                      <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#111111] font-semibold flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {fabric.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-sm px-3 py-1 text-white text-[11px] font-serif tracking-widest">
                      URVAAH ARCHIVE #{fabric.number}
                    </div>
                  </div>
                </div>

                {/* Narrative Column */}
                <div className={`lg:col-span-6 flex flex-col justify-center ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-serif text-[#D4AF37] font-light">
                      {fabric.number}
                    </span>
                    <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-neutral-500">
                      {fabric.tagline}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal uppercase text-[#111111] tracking-wide mb-5 leading-tight">
                    {fabric.title}
                  </h2>

                  <div className="w-12 h-[1px] bg-neutral-300 mb-6" />

                  {/* Body Paragraph 1 (Direct from User text) */}
                  <p className="text-sm sm:text-base text-neutral-800 font-serif leading-relaxed mb-4">
                    {fabric.description}
                  </p>

                  {/* Body Paragraph 2 (Styling Notes from User text) */}
                  <p className="text-sm sm:text-base text-neutral-600 font-sans leading-relaxed mb-6 font-light">
                    {fabric.stylingNotes}
                  </p>

                  {/* Best For Highlight Box */}
                  <div className="bg-[#F8F6F0] border-l-2 border-[#D4AF37] p-4 sm:p-5 mb-6">
                    <div className="text-[11px] font-sans uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-1">
                      Best For
                    </div>
                    <div className="text-sm sm:text-base font-serif text-[#111111] font-medium">
                      {fabric.bestFor}
                    </div>
                  </div>

                  {/* Sensory Profile Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 bg-white p-3 border border-neutral-200/80">
                    {fabric.sensoryProfile.map((spec, i) => (
                      <div key={i} className="px-2 py-1.5 border-r border-neutral-100 last:border-r-0">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-sans block">
                          {spec.label}
                        </span>
                        <span className="text-xs font-serif font-medium text-neutral-800 line-clamp-1">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA link */}
                  <div>
                    <Link
                      to={fabric.collectionLink}
                      className="inline-flex items-center gap-2 bg-[#111111] text-white text-xs font-sans font-medium uppercase tracking-[0.25em] px-6 py-3.5 hover:bg-neutral-800 transition-colors shadow-sm group"
                    >
                      <span>{fabric.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          );
        })}
      </section>

      {/* ── HOW TO CHOOSE THE RIGHT FABRIC FOR YOUR OUTFIT ── */}
      <section className="max-w-[1200px] mx-auto px-6 sm:px-10 mb-20 sm:mb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white border border-neutral-200/90 shadow-md p-8 sm:p-12 md:p-16 rounded-sm text-center"
        >
          <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-neutral-500 block mb-2">
            ATELIER DECISION GUIDE
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif uppercase tracking-wide text-[#111111] mb-4">
            How to Choose the Right Fabric for Your Outfit
          </h2>
          <div className="w-14 h-[1.5px] bg-[#D4AF37] mx-auto mb-6" />

          <p className="max-w-xl mx-auto text-sm sm:text-base font-serif text-neutral-600 mb-10 leading-relaxed font-light">
            The best fabric depends on the occasion and the comfort you prefer.
          </p>

          {/* 3 Occasion Decision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {quickGuidePills.map((guide, idx) => (
              <div
                key={idx}
                className="p-6 border border-neutral-200 hover:border-black bg-[#FAF9F6] transition-all flex flex-col justify-between group"
              >
                <div>
                  <span className={`inline-block px-2.5 py-0.5 text-[10px] font-sans uppercase tracking-widest font-semibold border rounded-sm mb-3 ${guide.badgeBg}`}>
                    {guide.title}
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-medium text-[#111111] mb-2">
                    {guide.fabric}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-neutral-600 leading-relaxed font-light mb-4">
                    {guide.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => scrollToSection(guide.targetId)}
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold tracking-wider text-[#111111] uppercase hover:text-[#D4AF37] transition-colors pt-3 border-t border-neutral-200 group-hover:border-neutral-300"
                >
                  <span>Explore Fabric Details</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── DISCOVER YOUR STYLE WITH HOUSE OF URVAAH (FINAL CTA) ── */}
      <section className="max-w-[1300px] mx-auto px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden bg-[#111111] text-white p-10 sm:p-14 md:p-20 text-center rounded-sm"
        >
          {/* Subtle Golden Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-[10px] sm:text-xs font-sans tracking-[0.3em] uppercase text-[#D4AF37] block mb-3 font-semibold">
              HOUSE OF URVAAH ATELIER
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif uppercase tracking-wide text-white mb-6 leading-tight">
              Discover Your Style with House of Urvaah
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-serif text-neutral-300 leading-relaxed font-light mb-8">
              From effortless everyday elegance to beautifully detailed occasion wear, the right fabric helps express your individual style. Explore the world of House of Urvaah, where refined details and thoughtful design bring modern ethnic fashion to life.
            </p>
            <p className="text-xs sm:text-sm font-sans tracking-widest uppercase text-neutral-400 mb-10">
              Discover your next favourite look with House of Urvaah.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/clothing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FAF9F6] text-[#111111] text-xs font-sans font-bold tracking-[0.25em] uppercase px-8 py-4 hover:bg-white transition-colors"
              >
                <span>EXPLORE ALL COLLECTIONS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center border border-neutral-600 text-white text-xs font-sans font-medium tracking-[0.25em] uppercase px-8 py-4 hover:border-white transition-colors"
              >
                RETURN TO HOMEPAGE
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </article>
  );
};

export default ExploreFabricsBlog;
