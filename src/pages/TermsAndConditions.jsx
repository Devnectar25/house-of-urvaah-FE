import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';

export const TermsAndConditions = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-20 pb-16 md:pt-28 md:pb-24 overflow-x-hidden">
      <SEOHead
        title="Terms & Conditions | House of Urvaah"
        description="Review the official Terms and Conditions governing your use of the House of Urvaah website, online purchases, and official store services."
        keywords="House of Urvaah terms and conditions, terms of service, legal notice, user agreement"
      />
      {/* 1. HERO HEADER */}
      <section className="w-full max-w-[1000px] mx-auto px-6 sm:px-10 mb-8 md:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="text-[10px] sm:text-xs font-serif uppercase tracking-[0.3em] text-neutral-400 block mb-2">
            LEGAL &amp; COMPLIANCE
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-2">
            TERMS AND CONDITIONS
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-serif italic mb-4">
            Last updated: November 24, 2026
          </p>
          <div className="w-12 h-[1px] bg-neutral-900/30" />
        </motion.div>
      </section>

      {/* 2. POLICY DOCUMENT CONTENT */}
      <section className="w-full max-w-[1000px] mx-auto px-6 sm:px-10 lg:px-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10 sm:space-y-12 text-neutral-700 leading-relaxed font-light text-sm sm:text-base font-serif"
        >
          {/* PREAMBLE / INTRODUCTORY STATEMENT */}
          <div className="pb-8 border-b border-neutral-200">
            <p className="text-neutral-700 leading-relaxed">
              Welcome to House Of Urvaah. These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of www.houseofurvaah.com and any purchase you make from us. By using the Website or placing an order, you agree to these Terms. If you do not agree, please do not use the Website.
            </p>
          </div>

          {/* 1. ELIGIBILITY */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              1. Eligibility
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              You must be at least 18 years old and capable of entering into a legally binding contract under the Indian Contract Act, 1872 to place an order. If you are under 18, you may use the Website only with a parent or guardian&apos;s involvement.
            </p>
          </div>

          {/* 2. YOUR ACCOUNT */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              2. Your Account
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              You are responsible for keeping your account details confidential and for all activity under your account. Please give us accurate and current information. We may suspend or close accounts that provide false information or breach these Terms.
            </p>
          </div>

          {/* 3. PRODUCTS AND DESCRIPTIONS */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              3. Products and Descriptions
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              We try to display our products, colours, sizes and details as accurately as possible. However, because of screen settings, lighting and the handcrafted nature of some items, slight variations in colour, finish or dimensions may occur, and these are not defects. All products are subject to availability, and we may discontinue or modify a product at any time.
            </p>
          </div>

          {/* 4. PRICING AND PAYMENT */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              4. Pricing and Payment
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              All prices are in Indian Rupees and, unless stated otherwise, are inclusive of applicable GST. Shipping charges are extra and shown at checkout.
            </p>
            <p className="text-neutral-700 leading-relaxed">
              We may change prices at any time without notice, but the price you see when you place your order is the price you pay.
            </p>
            <p className="text-neutral-700 leading-relaxed">
              We may cancel an order if a product was listed at an incorrect price due to a genuine error, and will refund any amount paid.
            </p>
            <p className="text-neutral-700 leading-relaxed">
              Payments are made through secure third-party gateways using methods such as UPI, cards, net banking, wallets and Cash on Delivery, if available. We are not responsible for failures or errors on the part of the payment provider or your bank.
            </p>
          </div>

          {/* 5. ORDER ACCEPTANCE */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              5. Order Acceptance
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              Placing an order is an offer to buy. A contract is formed only when we confirm and dispatch your order. We may refuse or cancel any order for reasons such as stock unavailability, suspected fraud, pricing errors, or inability to deliver to your location. If we cancel a paid order, we will refund you in full.
            </p>
          </div>

          {/* 6. SHIPPING AND DELIVERY */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              6. Shipping and Delivery
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              Shipping is governed by our{' '}
              <Link
                to="/shipping-policy"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                Shipping and Delivery Policy
              </Link>{' '}
              above, which forms part of these Terms.
            </p>
          </div>

          {/* 7. RETURNS, EXCHANGES AND REFUNDS */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              7. Returns, Exchanges and Refunds
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              Returns, exchanges and refunds are governed by our{' '}
              <Link
                to="/return-refund-policy"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                Returns and Refund Policy
              </Link>
              , which forms part of these Terms. Refunds, where applicable, are made to the original payment method within 7–10 business days of approval.
            </p>
          </div>

          {/* 8. DISCOUNTS AND PROMOTIONS */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              8. Discounts and Promotions
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              Discount codes and offers are valid only for the stated period and conditions, cannot be combined unless stated, have no cash value, and may be withdrawn at any time. We may cancel orders where a promotion has been misused.
            </p>
          </div>

          {/* 9. INTELLECTUAL PROPERTY */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              9. Intellectual Property
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              All content on the Website, including the House Of Urvaah name, logo, designs, product images, photographs, text, graphics and layout, belongs to us or our licensors and is protected by Indian copyright, trademark and other laws. You may not copy, reproduce, modify, distribute, or use any of it for commercial purposes without our prior written permission.
            </p>
          </div>

          {/* 10. USER CONDUCT */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              10. User Conduct
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              You agree not to:
            </p>
            <ul className="space-y-2.5 pl-5 list-disc marker:text-neutral-400 text-neutral-700 leading-relaxed">
              <li>Use the Website for any unlawful or fraudulent purpose;</li>
              <li>Attempt to hack, disrupt or overload the Website or its security;</li>
              <li>Use bots, scrapers or automated tools without permission;</li>
              <li>Post false, abusive, defamatory or infringing content in reviews or messages;</li>
              <li>Impersonate another person or provide false information.</li>
            </ul>
          </div>

          {/* 11. REVIEWS AND USER CONTENT */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              11. Reviews and User Content
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              If you submit reviews, photos or comments, you grant us a non-exclusive, royalty-free, worldwide licence to use, display and reproduce them for operating and promoting the Website. You confirm you own or have the right to share that content. We may remove content at our discretion.
            </p>
          </div>

          {/* 12. DISCLAIMER OF WARRANTIES */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              12. Disclaimer of Warranties
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              The Website and its content are provided &quot;as is&quot; and &quot;as available&quot;. To the fullest extent permitted by law, we do not guarantee that the Website will be uninterrupted, error-free or free from viruses. Nothing in these Terms limits any right you have as a consumer under the Consumer Protection Act, 2019 or other applicable law.
            </p>
          </div>

          {/* 13. LIMITATION OF LIABILITY */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              13. Limitation of Liability
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              To the extent permitted by law, House Of Urvaah will not be liable for any indirect, incidental or consequential loss arising from your use of the Website or products. Our total liability for any claim relating to an order will not exceed the amount you paid for that order.
            </p>
          </div>

          {/* 14. INDEMNITY */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              14. Indemnity
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              You agree to indemnify and hold harmless House Of Urvaah, its owners and employees from claims, losses or expenses arising from your breach of these Terms or misuse of the Website.
            </p>
          </div>

          {/* 15. FORCE MAJEURE */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              15. Force Majeure
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              We are not liable for delay or failure to perform caused by events beyond our reasonable control, including natural disasters, pandemics, strikes, government action, internet or power failure, or courier disruptions.
            </p>
          </div>

          {/* 16. THIRD-PARTY LINKS AND SERVICES */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              16. Third-Party Links and Services
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              The Website may contain links to third-party websites or services. We do not control or endorse them and are not responsible for their content or practices.
            </p>
          </div>

          {/* 17. PRIVACY AND COOKIES */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              17. Privacy and Cookies
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              Your use of the Website is also governed by our{' '}
              <Link
                to="/privacy-policy"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/cookie-policy"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          {/* 18. GOVERNING LAW AND JURISDICTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              18. Governing Law and Jurisdiction
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              These Terms are governed by the laws of India. Subject to any rights you have as a consumer, the courts at Mumbai, Maharashtra shall have exclusive jurisdiction over any dispute.
            </p>
          </div>

          {/* 19. CHANGES TO THESE TERMS */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              19. Changes to These Terms
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              We may update these Terms at any time. The updated version applies from the date it is posted on the Website. Please review them periodically.
            </p>
          </div>

          {/* 20. GRIEVANCE REDRESSAL */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              20. Grievance Redressal
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              For complaints, contact our Grievance Officer: [Name], Email:{' '}
              <a
                href="mailto:houseofurvaah@yahoo.com"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                houseofurvaah@yahoo.com
              </a>
              , Phone:{' '}
              <a
                href="tel:+919833325657"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                98333 25657
              </a>
              . As required under the Consumer Protection (E-Commerce) Rules, 2020, we will acknowledge your complaint within 48 hours and resolve it within one month.
            </p>
          </div>

          {/* 21. CONTACT US */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              21. Contact Us
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              House Of Urvaah, [Full address], Mumbai, Maharashtra, India. Email:{' '}
              <a
                href="mailto:houseofurvaah@yahoo.com"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                houseofurvaah@yahoo.com
              </a>
              . Phone:{' '}
              <a
                href="tel:+919833325657"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                98333 25657
              </a>
              .
            </p>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default TermsAndConditions;
