import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-20 md:pt-32 md:pb-28 overflow-x-hidden">
      {/* 1. HERO HEADER */}
      <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mb-3 block">
            LEGAL & COMPLIANCE
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-wider uppercase text-[#111111] mb-6">
            PRIVACY POLICY
          </h1>
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-6" />
        </motion.div>
      </section>

      {/* 2. POLICY DOCUMENT CONTENT */}
      <section className="w-full max-w-[960px] mx-auto px-6 sm:px-10 lg:px-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10 text-neutral-800 leading-relaxed font-light text-sm sm:text-base font-serif"
        >
          {/* INTRODUCTORY PARAGRAPHS */}
          <div className="space-y-5 pb-6 border-b border-neutral-200">
            <p>
              This Privacy Policy applies to our practices in connection with the House of Urvaah online store, available on the website www.houseofurvaah.com and any associated store pages or mobile application (the &quot;Platform&quot; or &quot;House of Urvaah&quot;). It describes how House of Urvaah (&quot;House of Urvaah&quot;, the &quot;Company&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) collects, uses, shares, stores and protects information when you (the &quot;User&quot;, &quot;Customer&quot; or &quot;you&quot;) access the Platform or purchase products through it.
            </p>
            <p>
              Protecting your privacy is a priority. Any personal information you voluntarily provide will be treated with a high standard of security and confidentiality and used strictly for the purposes described in this Privacy Policy. By accessing the Platform or placing an order, you consent to the data practices described here. This Privacy Policy should be read together with the Terms &amp; Conditions, the Shipping Information, the Returns &amp; Exchanges Policy, and the Cookie Settings.
            </p>
            <p>
              We process personal data in accordance with the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;), the Information Technology Act, 2000 and the rules thereunder, and other applicable Indian law.
            </p>
          </div>

          {/* SECTION 1 */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              1. Information We Collect
            </h2>
            <p>
              We collect data to provide you with the best shopping experience. This includes:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Contact information:</strong> First and last name, email address, postal/shipping address, city, state, PIN code, country, and phone number.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Account information:</strong> Registration details, login ID, password (stored in encrypted form), size preferences, wishlist items, and order history.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Order &amp; transaction information:</strong> Products ordered, items placed in your bag, order date, value, invoices, delivery details, transaction history, and style preferences.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Financial / payment information:</strong> Payment instrument details, mode/manner of payment, and billing information. Card, UPI, and bank details are processed securely by third-party payment service providers; the Company does not store full card numbers.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Reviews &amp; user content:</strong> Ratings, reviews, feedback, fit notes, photos, questions, and other content you submit about products or the Platform.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Technical &amp; usage information:</strong> Device and app usage, browser type, IP address, referral data, server-log data, and similar information collected by automated means such as cookies and pixels.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Marketing &amp; preference information:</strong> Communication preferences, responses to surveys or promotions, offer engagement, and style/category interests used to personalize your feed.
              </li>
            </ul>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              2. How We Use Your Information
            </h2>
            <p>
              We use your information to operate and improve the Platform, including:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Creating, managing, and authenticating your account;</li>
              <li>Processing, fulfilling, delivering, tracking, and handling cancellations, refunds, or returns/exchanges;</li>
              <li>Processing secure payments and issuing invoices;</li>
              <li>Communicating order status updates, delivery coordination, and queries via SMS, email, in-app notification, and phone;</li>
              <li>Personalizing your shopping experience with relevant product recommendations, sizing guidance, and layout design;</li>
              <li>Publishing and displaying reviews, ratings, and feedback you submit;</li>
              <li>Sending newsletters, promotional communication, private sale invitations, and marketing campaigns (where not opted out);</li>
              <li>Conducting internal trend research, demographical analysis, and usage analytics;</li>
              <li>Detecting, preventing, and addressing fraud, security incidents, abuse, and other illegal activities;</li>
              <li>Complying with applicable company audits, billing, and regulatory laws.</li>
            </ul>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              3. Cookies, Analytics &amp; Advertising
            </h2>
            <p>
              Each time you visit the Platform, our servers log basic technical information (e.g. browser type, device, domain name, referral data, and site activity). We use cookies, pixels, and similar technologies to maintain your bag/cart session, remember preferences, and analyze site performance. You can manage cookies in your browser settings; disabling them may affect Platform functionality. Further detail is provided in our Cookie Settings.
            </p>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              4. How We Share Your Information
            </h2>
            <p>
              We do not sell your identifiable personal information. We share data only as follows:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Fulfillment &amp; logistics partners:</strong> Minimum necessary info (name, delivery address, phone, order value) is shared with courier partners to coordinate delivery and return/exchange requests.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Payment service providers:</strong> Transaction details are shared with gateway aggregators and banks to process payments and refunds securely.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Service providers:</strong> Trusted providers handling hosting, analytics, customer support, and marketing assistance operate under strict data-protection agreements.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Brand &amp; design partners:</strong> For collaborations or limited-edition drops, basic order information may be shared for fulfillment purposes only.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Within the House of Urvaah group:</strong> Shared with affiliates to maintain account consistency and benefits, subject to law.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Legal, safety &amp; compliance:</strong> Disclosed to regulatory or law-enforcement authorities where required to comply with legal processes or prevent fraud.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Business transfers:</strong> Data may be transferred as a business asset in a merger, acquisition, or restructuring.
              </li>
            </ul>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              5. App &amp; Device Permissions
            </h2>
            <p>
              For mobile app users, the Platform may request permissions to provide specific functions:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Location:</strong> To verify address, check PIN code serviceability, and speed up delivery.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">SMS:</strong> To auto-read One-Time Passwords (OTPs) securely.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Phone:</strong> To allow one-click calls to support or delivery agents.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Media / storage / camera:</strong> To save invoices, upload photos for return/exchange claims, and enable virtual try-on or fit-check features where available.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Notifications:</strong> For delivery alerts, order updates, and new-drop announcements.
              </li>
            </ul>
            <p>
              You can manage or revoke these permissions in your mobile operating system settings at any time.
            </p>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              6. Data Security
            </h2>
            <p>
              We implement reasonable technical and organizational security measures — including SSL/TLS encryption for payment and login data — to protect your information against unauthorized access or disclosure.
            </p>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              7. Contact Us
            </h2>
            <p>
              For any privacy-related questions, concerns, or requests, please reach out to our Grievance Officer at:
            </p>
            <p>
              Email: [privacy@houseofurvaah.com] Support: [support@houseofurvaah.com]
            </p>
          </div>

          {/* CLOSING LEGAL NOTICE */}
          <div className="pt-6 border-t border-neutral-200">
            <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-600 rounded-sm italic leading-relaxed">
              This Privacy Policy is provided as a starting draft based on the structure of a reference policy and is not a substitute for legal advice. Before publishing this on a live site, have it reviewed by a qualified lawyer to ensure it accurately reflects House of Urvaah&apos;s actual data practices, entity details, and compliance obligations under the DPDP Act, 2023 and any other applicable law.
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
