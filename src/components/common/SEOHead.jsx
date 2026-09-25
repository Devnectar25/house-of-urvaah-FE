import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_DOMAIN = 'https://houseofurvaah.com';
const DEFAULT_IMAGE = '/assets/Images/Brown01.png';

/**
 * SEOHead - Headless SEO metadata component
 * Generates dynamic page titles, descriptions, meta tags, Open Graph, Twitter cards, and canonical links.
 * 
 * STRICT CONSTRAINT: This component returns null and alters ZERO visual layout or CSS styles.
 */
export const SEOHead = ({
  title = "House of Urvaah | Official Online Store",
  description = "House of Urvaah — Premium luxury clothing, architectural tailoring, silk dresses, and minimal fashion inspired by high-fashion runway design.",
  keywords = "House of Urvaah, luxury fashion, women's clothing, architectural tailoring, silk dresses, co-ord sets, high fashion",
  canonicalUrl,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noindex = false
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    if (title) {
      document.title = title;
    }

    // Determine current canonical URL
    const fullCanonicalUrl = canonicalUrl || `${DEFAULT_DOMAIN}${location.pathname}`;

    // Helper to create or update meta tags by name or property attribute
    const setMetaTag = (attributeName, attributeValue, contentValue) => {
      if (contentValue === undefined || contentValue === null) return;
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // Helper to create or update link tags
    const setLinkTag = (relValue, hrefValue) => {
      if (!hrefValue) return;
      let element = document.querySelector(`link[rel="${relValue}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', relValue);
        document.head.appendChild(element);
      }
      element.setAttribute('href', hrefValue);
    };

    // Standard Meta Tags
    setMetaTag('name', 'description', description);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // Robots indexing tag
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow');
    }

    // Canonical Link
    setLinkTag('canonical', fullCanonicalUrl);

    // Open Graph Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', fullCanonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    if (ogImage) {
      const fullOgImage = ogImage.startsWith('http') ? ogImage : `${DEFAULT_DOMAIN}${ogImage}`;
      setMetaTag('property', 'og:image', fullOgImage);
    }

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (ogImage) {
      const fullOgImage = ogImage.startsWith('http') ? ogImage : `${DEFAULT_DOMAIN}${ogImage}`;
      setMetaTag('name', 'twitter:image', fullOgImage);
    }

  }, [title, description, keywords, canonicalUrl, ogImage, ogType, noindex, location.pathname]);

  return null;
};

export default SEOHead;
