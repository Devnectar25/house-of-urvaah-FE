import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  RefreshCw,
  UserCheck,
  Key,
  ShieldAlert,
  ShoppingBag,
  Tag,
  CheckCircle,
  CreditCard,
  Truck,
  RotateCcw,
  Copyright,
  MessageSquare,
  ExternalLink,
  Server,
  AlertCircle,
  Scale,
  Shield,
  Lock,
  Ban,
  FileText,
  Mail,
  Layers,
  PhoneCall,
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';

export const TermsAndConditions = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-20 md:pt-32 md:pb-28 overflow-x-hidden">
      <SEOHead
        title="Terms & Conditions | House of Urvaah"
        description="Review the official Terms and Conditions governing your use of the House of Urvaah website, online purchases, and official atelier services."
        keywords="House of Urvaah terms and conditions, terms of service, legal notice, user agreement"
      />
      {/* 1. HERO HEADER */}
      <section className="w-full max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="px-3.5 py-1 bg-neutral-100 text-neutral-800 text-[10px] sm:text-xs font-serif font-semibold rounded-full uppercase tracking-[0.25em] mb-3 inline-block">
            LEGAL &amp; COMPLIANCE
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-6">
            TERMS AND CONDITIONS
          </h1>
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-6" />
        </motion.div>
      </section>

      {/* 2. POLICY DOCUMENT CONTENT WRAPPED IN CENTERED CARD */}
      <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200/90 p-6 sm:p-10 md:p-14 space-y-12 text-neutral-800 leading-relaxed font-light text-sm sm:text-base font-serif"
        >
          {/* PREAMBLE / INTRODUCTORY PARAGRAPHS */}
          <div className="space-y-5 pb-6 border-b border-neutral-200">
            <p>
              This document is an electronic record and is published in accordance with applicable law, including the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, which require e-commerce platforms to publish their terms of use, privacy policy and related rules.
            </p>
            <p>
              These Terms &amp; Conditions (&quot;Terms&quot;), together with our Privacy Policy, Shipping &amp; Delivery Policy, Cancellation, Return, Exchange &amp; Refund Policy, and Cookie Policy (collectively, the &quot;Policies&quot;), govern your access to and use of the House of Urvaah website and mobile application (the &quot;Platform&quot;), including all products, content and services offered through it.
            </p>
            <p>
              By accessing, browsing, registering on, or placing an order through the Platform, you agree to be bound by these Terms in full. If you do not agree with these Terms, please do not use the Platform.
            </p>
          </div>

          {/* SECTION 1 */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Building2 className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                1. About House of Urvaah
              </h2>
            </div>
            <p>
              References to &quot;House of Urvaah&quot;, &quot;the Company&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot; mean [Insert Legal Name], the owner and operator of the Platform, with its registered office at [Insert Business Address]. References to &quot;you&quot;, &quot;your&quot;, &quot;User&quot; or &quot;Customer&quot; mean any person who accesses, browses or uses the Platform, including anyone who places an order.
            </p>
            <p>
              House of Urvaah is an online fashion retailer offering women&apos;s clothing, apparel and accessories (&quot;Products&quot;) for sale through the Platform. Except where a product is expressly identified as being sold by a third-party seller, House of Urvaah is the seller of the Products listed on the Platform.
            </p>

            {/* SUB-SECTION 1.1 */}
            <div className="space-y-2 pl-0 sm:pl-4 mt-4">
              <h3 className="text-base sm:text-lg font-serif font-semibold text-neutral-900 tracking-wide">
                1.1 Listings Are an Invitation to Offer
              </h3>
              <p>
                Products displayed on the Platform are an invitation for you to make an offer to purchase, not a guaranteed offer for sale by us. When you place an order, you are making an offer to buy the selected item(s), which we may accept or decline. A binding sale is formed only once we confirm and dispatch your order, as described in Section 8. We may correct pricing, description or availability errors at any time, including after an order is submitted, without prior notice.
              </p>
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <RefreshCw className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                2. Changes to These Terms
              </h2>
            </div>
            <p>
              We may update these Terms from time to time to reflect changes in our business, products, or legal requirements. The most current version will always be available on this page, and continuing to use the Platform after changes are posted means you accept the updated Terms. Where practical, we&apos;ll notify you of significant changes via email or an in-app/on-site notice before they take effect.
            </p>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <UserCheck className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                3. Who Can Use the Platform
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                You must be at least 18 years old to place an order on the Platform. If you are under 18, you may browse the Platform only with the involvement and consent of a parent or legal guardian, who agrees to be bound by these Terms on your behalf.
              </li>
              <li>
                By using the Platform, you confirm that you are legally capable of entering into a binding contract.
              </li>
            </ul>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Key className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                4. Account Registration &amp; Your Responsibilities
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                To place an order, you may need to create an account. You agree to provide accurate, current, and complete information, and to keep your details updated.
              </li>
              <li>
                You are responsible for keeping your login credentials confidential and for all activity that happens under your account. Please don&apos;t share your password with anyone.
              </li>
              <li>
                If you believe your account has been accessed without your permission, contact us immediately at [Insert Email Address]. We are not responsible for losses caused by unauthorized use of your account that results from you not keeping your credentials secure.
              </li>
              <li>
                Any data or connectivity charges from your mobile network or internet provider while using the Platform are your responsibility.
              </li>
            </ul>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <ShieldAlert className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                5. Acceptable Use of the Platform
              </h2>
            </div>
            <p>
              You agree to use the Platform only for lawful purposes. You must not:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Post or share content that is unlawful, abusive, defamatory, obscene, or infringes anyone else&apos;s rights (including copyright, trademark, or privacy rights);</li>
              <li>Impersonate any person, brand, or entity, including House of Urvaah;</li>
              <li>Upload viruses, malware, or any code designed to disrupt or damage the Platform;</li>
              <li>Attempt to probe, scan, or breach the security of the Platform or its systems;</li>
              <li>Use bots, scrapers, or other automated tools to access, copy, or extract data (including product listings, prices, or images) from the Platform;</li>
              <li>Interfere with or disrupt the Platform&apos;s functioning or other users&apos; ability to use it;</li>
              <li>Use the Platform to run unauthorized surveys, contests, chain letters, or promotional schemes.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate access for anyone who violates this section.
            </p>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <ShoppingBag className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                6. Products, Descriptions, Images &amp; Availability
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                We make every effort to accurately display our products, including descriptions, materials, sizing information, and photographs. However, due to factors like screen settings and lighting, actual colors may vary slightly from what&apos;s shown on your device.
              </li>
              <li>
                Product images are for representation purposes; minor variations in color, texture, or design detail may occur, especially for handcrafted or embellished pieces.
              </li>
              <li>
                Sizes shown follow our standard size chart, available on each product page. We recommend checking measurements carefully before ordering, as fit can vary between styles.
              </li>
              <li>
                All products are subject to availability. We reserve the right to limit quantities, discontinue a style, or modify product details (including pricing) at any time without prior notice — including after you&apos;ve placed an order, in which case the applicable resolution under our Cancellation, Return, Exchange &amp; Refund Policy will apply.
              </li>
            </ul>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Tag className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                7. Pricing, Offers, Discounts &amp; Taxes
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                All prices displayed on the Platform are in [Insert Currency, e.g. Indian Rupees (INR)] and are inclusive of applicable taxes, unless stated otherwise.
              </li>
              <li>
                The price charged for a product is the price displayed at the time your order is accepted, subject to our right to correct pricing errors as described in Section 1.1.
              </li>
              <li>
                Any additional charges — such as shipping fees — will be clearly shown at checkout before you confirm your order. No hidden charges apply.
              </li>
              <li>
                Discounts, promo codes, sale offers, and other promotions are offered at our discretion and may be subject to specific terms (such as minimum order value, validity period, or eligible products), which will be communicated at the time of the offer.
              </li>
              <li>
                We are not responsible for promo codes that are shared, leaked, or used outside their intended terms, and reserve the right to cancel orders where a coupon or discount was applied in error or through misuse.
              </li>
            </ul>
          </div>

          {/* SECTION 8 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <CheckCircle className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                8. Orders &amp; Order Acceptance
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                Placing an order on the Platform is an offer by you to purchase the selected products. We will send an order confirmation, but this does not automatically guarantee acceptance — a binding sale is formed only once your order is confirmed and dispatched.
              </li>
              <li>
                We may decline or cancel an order (in full or in part) for reasons including: the product is out of stock, there&apos;s a pricing or listing error, we&apos;re unable to verify your payment, the delivery address isn&apos;t serviceable, or we suspect fraudulent activity.
              </li>
              <li>
                If we cancel an order for which payment was already made, we&apos;ll process a refund in accordance with our Cancellation, Return, Exchange &amp; Refund Policy.
              </li>
              <li>
                Please verify your order upon delivery. If you receive the wrong, damaged, or incomplete order, notify us within the timeframe specified in our Cancellation, Return, Exchange &amp; Refund Policy.
              </li>
              <li>
                Products purchased through the Platform are for personal use only and may not be resold or used for commercial purposes.
              </li>
            </ul>
          </div>

          {/* SECTION 9 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <CreditCard className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                9. Payments
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                We accept payments through the methods displayed at checkout, which may include credit/debit cards, UPI, net banking, digital wallets, and Cash on Delivery (where available).
              </li>
              <li>
                All payments are processed through secure third-party payment gateways. We do not store your full card details.
              </li>
              <li>
                We are not responsible for payment failures, delays, or declines caused by your bank, payment provider, or other third parties beyond our control.
              </li>
              <li>
                If you notice an incorrect charge on your order, please contact us within [Insert Timeframe] so we can look into it.
              </li>
            </ul>
          </div>

          {/* SECTION 10 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Truck className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                10. Shipping &amp; Delivery
              </h2>
            </div>
            <p>
              Order processing, dispatch, and delivery are governed by our Shipping &amp; Delivery Policy, which forms part of these Terms. By placing an order, you agree to its terms, including estimated delivery timelines, serviceable areas, and delivery procedures.
            </p>
            <p>
              Deliveries are carried out by independent third-party courier and logistics partners. While we work closely with them to ensure timely delivery, we are not liable for delays or issues caused directly by these partners, beyond the remedies outlined in our Shipping &amp; Delivery Policy and Cancellation, Return, Exchange &amp; Refund Policy.
            </p>
          </div>

          {/* SECTION 11 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <RotateCcw className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                11. Cancellations, Returns, Exchanges &amp; Refunds
              </h2>
            </div>
            <p>
              Order cancellations, product returns, exchanges, and refunds are governed by our Cancellation, Return, Exchange &amp; Refund Policy, which forms part of these Terms. Please review that policy for eligibility windows, product condition requirements, and refund timelines before placing your order.
            </p>
          </div>

          {/* SECTION 12 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Copyright className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                12. Intellectual Property
              </h2>
            </div>
            <p>
              All content on the Platform — including our logo, brand name, product photography, graphics, website design, layout, and written content — is owned by or licensed to House of Urvaah and is protected under applicable intellectual property laws.
            </p>
            <p>
              You may browse the Platform and view its content for your own personal, non-commercial use. You may not copy, reproduce, republish, distribute, modify, or otherwise commercially exploit any content from the Platform without our prior written permission.
            </p>
            <p>
              Any third-party trademarks, brand names, or logos featured on the Platform (for example, in collaboration products) remain the property of their respective owners.
            </p>
          </div>

          {/* SECTION 13 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <MessageSquare className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                13. Reviews, Ratings &amp; User Content
              </h2>
            </div>
            <p>
              If the Platform allows you to submit product reviews, ratings, photos, or comments (&quot;User Content&quot;), you agree that your submission will not:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Contain false, misleading, defamatory, obscene, or offensive content;</li>
              <li>Infringe someone else&apos;s copyright or other rights (only submit content you own or have permission to share);</li>
              <li>Include advertisements, spam, or solicitations;</li>
              <li>Impersonate another person or brand.</li>
            </ul>
            <p>
              By submitting User Content, you grant House of Urvaah a non-exclusive, royalty-free, worldwide right to use, display, reproduce, and share that content in connection with the Platform and our marketing (for example, featuring a customer photo in our social media or website). We reserve the right to remove any User Content at our discretion, without prior notice.
            </p>
          </div>

          {/* SECTION 14 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <ExternalLink className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                14. Third-Party Links
              </h2>
            </div>
            <p>
              The Platform may contain links to third-party websites, social media pages, or services. We don&apos;t control these third parties and are not responsible for their content, practices, or policies. Visiting a linked site is at your own discretion and risk.
            </p>
          </div>

          {/* SECTION 15 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Server className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                15. Website Availability &amp; Technical Issues
              </h2>
            </div>
            <p>
              We aim to keep the Platform running smoothly, but we don&apos;t guarantee that it will always be available, uninterrupted, or error-free. The Platform may occasionally be unavailable for maintenance, updates, or due to circumstances beyond our control. We are not liable for any inconvenience or loss resulting from such downtime.
            </p>
          </div>

          {/* SECTION 16 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <AlertCircle className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                16. Disclaimer of Warranties
              </h2>
            </div>
            <p>
              The Platform and its content are provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the extent permitted by law, we do not make any warranties — express or implied — regarding the accuracy, reliability, or fitness of the Platform, its content, or the products sold through it, beyond what is expressly stated in these Terms and applicable consumer protection law.
            </p>
            <p>
              This does not affect any statutory rights you have as a consumer that cannot lawfully be excluded.
            </p>
          </div>

          {/* SECTION 17 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Scale className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                17. Limitation of Liability
              </h2>
            </div>
            <p>
              To the maximum extent permitted by applicable law, House of Urvaah&apos;s total liability for any claim arising from your use of the Platform or a specific order is limited to the amount you actually paid for that order.
            </p>
            <p>
              We are not liable for any indirect, incidental, or consequential losses (such as loss of enjoyment or inconvenience) arising from your use of, or inability to use, the Platform, except where such liability cannot be excluded under applicable law.
            </p>
          </div>

          {/* SECTION 18 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Shield className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                18. Indemnification
              </h2>
            </div>
            <p>
              You agree to hold House of Urvaah, its employees, and representatives harmless from any claims, losses, or expenses (including reasonable legal fees) arising from your misuse of the Platform, your breach of these Terms, or any content you submit that infringes someone else&apos;s rights.
            </p>
          </div>

          {/* SECTION 19 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Lock className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                19. Privacy &amp; Cookies
              </h2>
            </div>
            <p>
              Your use of the Platform is also governed by our Privacy Policy and Cookie Policy, which explain how we collect, use, and protect your personal information, and how we use cookies to improve your browsing experience. Please review both policies to understand our practices.
            </p>
          </div>

          {/* SECTION 20 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Ban className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                20. Termination
              </h2>
            </div>
            <p>
              We may suspend or terminate your access to the Platform at any time, with or without notice, if you breach these Terms, engage in fraudulent or abusive behavior, or if required to do so by law. We are not liable to you for any such suspension or termination.
            </p>
          </div>

          {/* SECTION 21 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <FileText className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                21. Governing Law &amp; Dispute Resolution
              </h2>
            </div>
            <p>
              These Terms are governed by the laws of [Insert Governing Jurisdiction]. Any disputes arising from these Terms or your use of the Platform will be subject to the exclusive jurisdiction of the courts of [Insert Governing Jurisdiction].
            </p>
            <p>
              If you have a complaint or concern, we encourage you to reach out to our support team first (see Section 22) so we can try to resolve it directly before pursuing any other course of action.
            </p>
          </div>

          {/* SECTION 22 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Mail className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                22. Contact Us
              </h2>
            </div>
            <p>
              If you have questions about these Terms, or need help with an order, please reach out:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-6 rounded-xl border border-neutral-200 text-xs sm:text-sm">
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Email</p>
                <p className="font-semibold text-neutral-900">[Insert Email Address]</p>
              </div>
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Support Hours</p>
                <p className="font-semibold text-neutral-900">[Insert Support Hours]</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Address</p>
                <p className="font-semibold text-neutral-900">[Insert Business Address]</p>
              </div>
            </div>
          </div>

          {/* SECTION 23 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Layers className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                23. Miscellaneous
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Entire agreement:</strong> These Terms, along with our referenced Policies, make up the entire agreement between you and House of Urvaah regarding your use of the Platform.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Severability:</strong> If any part of these Terms is found to be invalid or unenforceable, the remaining sections will continue to apply in full.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">No waiver:</strong> If we don&apos;t enforce a particular term, it doesn&apos;t mean we&apos;ve waived our right to enforce it later.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Assignment:</strong> You may not transfer your rights or obligations under these Terms to anyone else. We may transfer ours as part of a business transition (such as a merger or sale).
              </li>
            </ul>
          </div>

          {/* SECTION 24 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <PhoneCall className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                24. Contact Details
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-6 rounded-xl border border-neutral-200 text-xs sm:text-sm">
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Company</p>
                <p className="font-semibold text-neutral-900">House of Urvaah / [Insert Legal Name]</p>
              </div>
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Email</p>
                <p className="font-semibold text-neutral-900">[Insert Email Address]</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Registered Address</p>
                <p className="font-semibold text-neutral-900">[Insert Business Address]</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Support Hours</p>
                <p className="font-semibold text-neutral-900">[Insert Support Hours]</p>
              </div>
            </div>
          </div>

          {/* CLOSING LEGAL NOTICE NESTED BOTTOM BANNER */}
          <div className="border-t border-neutral-200 pt-8 mt-12 bg-neutral-50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 md:-mx-14 md:-mb-14 p-6 sm:p-10 rounded-b-2xl text-center space-y-3">
            <div className="max-w-3xl mx-auto text-xs sm:text-sm text-neutral-600 italic leading-relaxed">
              This Terms &amp; Conditions document is provided as a starting draft based on the structure of a reference policy and is not a substitute for legal advice. Before publishing this on a live site, please have it reviewed by a qualified legal professional to ensure it accurately reflects House of Urvaah&apos;s actual business details, entity structure, and compliance obligations under applicable consumer protection and e-commerce law.
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default TermsAndConditions;
