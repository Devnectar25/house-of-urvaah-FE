import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';

export const PrivacyPolicy = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-20 pb-16 md:pt-28 md:pb-24 overflow-x-hidden">
      <SEOHead
        title="Privacy Policy | House of Urvaah"
        description="Read the official House of Urvaah Privacy Policy to learn how we collect, handle, and safeguard your personal information and shopping security."
        keywords="House of Urvaah privacy policy, data security, customer privacy, legal terms, DPDP Act"
      />
      {/* 1. HERO HEADER */}
      <section className="w-full max-w-[960px] mx-auto px-4 sm:px-8 md:px-12 mb-8 md:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="text-[10px] sm:text-xs font-serif uppercase tracking-[0.3em] text-neutral-400 block mb-2">
            LEGAL &amp; COMPLIANCE
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-normal tracking-[0.15em] uppercase text-[#111111] mb-2">
            PRIVACY POLICY
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-serif italic mb-4">
            Last updated: November 27, 2026
          </p>
          <div className="w-12 h-[1px] bg-neutral-900/30" />
        </motion.div>
      </section>

      {/* 2. POLICY DOCUMENT CONTENT - SEAMLESS LUXURY EDITORIAL LAYOUT */}
      <section className="w-full max-w-[960px] mx-auto px-4 sm:px-8 md:px-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 sm:space-y-10 md:space-y-12 text-neutral-700 leading-relaxed font-light text-sm sm:text-base font-serif text-left sm:text-justify [text-justify:inter-word] break-words"
        >
          {/* INTRODUCTORY PARAGRAPHS */}
          <div className="space-y-4 pb-6 sm:pb-8 border-b border-neutral-200 text-left sm:text-justify [text-justify:inter-word]">
            <p>
              This Privacy Policy applies to our practices in connection with the House of Urvaah online store, available on the website{' '}
              <a
                href="https://www.houseofurvaah.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal"
              >
                www.houseofurvaah.com
              </a>{' '}
              and any associated store pages or mobile application (the &quot;Platform&quot; or &quot;House of Urvaah&quot;). It describes how House of Urvaah (&quot;House of Urvaah&quot;, the &quot;Company&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) collects, uses, shares, stores and protects information when you (the &quot;User&quot;, &quot;Customer&quot; or &quot;you&quot;) access the Platform or purchase products through it.
            </p>
            <p>
              Protecting your privacy is a priority. Any personal information you voluntarily provide will be treated with a high standard of security and confidentiality and used strictly for the purposes described in this Privacy Policy. By accessing the Platform or placing an order, you consent to the data practices described here. This Privacy Policy should be read together with the{' '}
              <Link to="/terms-and-conditions" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Terms &amp; Conditions
              </Link>
              , the{' '}
              <Link to="/shipping-delivery-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Shipping &amp; Delivery Policy
              </Link>
              , the{' '}
              <Link to="/cancellation-return-refund-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Cancellation, Return, Exchange &amp; Refund Policy
              </Link>
              , and the{' '}
              <Link to="/cookie-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Cookie Policy
              </Link>
              .
            </p>
            <p>
              We process personal data in accordance with the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;), the Information Technology Act, 2000 and the rules thereunder, and other applicable Indian law.
            </p>
          </div>

          {/* 1. INFORMATION WE COLLECT */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              1. Information We Collect
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We collect data to provide you with the best shopping experience. This includes:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
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
                <strong className="font-semibold text-neutral-900">Financial / payment information:</strong> Payment instrument details, mode/manner of payment, and billing information. Card, UPI, and bank details are processed securely by third-party payment service providers. We do not store your full card number, CVV, UPI PIN or net-banking credentials; we may receive only limited details such as payment status, transaction ID and the last four digits of your card.
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

          {/* 2. HOW WE USE YOUR INFORMATION */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              2. How We Use Your Information
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We use your information to operate and improve the Platform, including:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
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

          {/* 3. LEGAL BASIS AND CONSENT */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              3. Legal Basis and Consent
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We process your personal data based on your consent, to perform our contract with you (fulfilling your order), and to meet our legal obligations under the laws mentioned above.
            </p>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              You may withdraw your consent at any time by contacting us. Withdrawal does not affect processing already carried out, and may limit our ability to provide some services (for example, fulfilling an order).
            </p>
          </div>

          {/* 4. COOKIES, ANALYTICS & ADVERTISING */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              4. Cookies, Analytics &amp; Advertising
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Each time you visit the Platform, our servers log basic technical information (e.g. browser type, device, domain name, referral data, and site activity). We use cookies, pixels, and similar technologies to maintain your bag/cart session, remember preferences, and analyze site performance. You can manage cookies in your browser settings; disabling them may affect Platform functionality. Further detail is provided in our{' '}
              <Link to="/cookie-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          {/* 5. HOW WE SHARE YOUR INFORMATION */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              5. How We Share Your Information
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We do not sell your personal information. We share it only with the following parties, and only for the purposes stated:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>
                <strong className="font-semibold text-neutral-900">Courier &amp; logistics partners:</strong> To deliver your order. Only the minimum necessary information (name, delivery address, phone, order value) is shared, to coordinate delivery and return/exchange requests.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Payment gateways:</strong> To process payments and refunds. Transaction details are shared securely with payment gateway providers and banks.
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

          {/* 6. APP & DEVICE PERMISSIONS */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              6. App &amp; Device Permissions
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              For mobile app users, the Platform may request permissions to provide specific functions:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
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
            <p className="text-neutral-700 leading-relaxed pt-1 text-left sm:text-justify [text-justify:inter-word]">
              You can manage or revoke these permissions in your mobile operating system settings at any time.
            </p>
          </div>

          {/* 7. DATA RETENTION */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              7. Data Retention
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We keep personal data only for as long as it is needed for the purposes described in this Privacy Policy, or as required by law (for example, tax and invoice records are retained for the period required under Indian law). After that, we delete or anonymize it.
            </p>
          </div>

          {/* 8. DATA SECURITY */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              8. Data Security
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We implement reasonable technical and organizational security measures — including SSL/TLS (HTTPS) encryption for payment and login data, and access controls — to protect your information against unauthorized access or disclosure. However, no method of transmission over the internet is completely secure, so we cannot guarantee absolute security. Please keep your account password confidential.
            </p>
          </div>

          {/* 9. YOUR RIGHTS */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              9. Your Rights
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left">
              Subject to applicable law, you may:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>access the personal data we hold about you;</li>
              <li>ask us to correct or update inaccurate data;</li>
              <li>ask us to delete your data (except where we must retain it by law);</li>
              <li>withdraw consent or opt out of marketing messages (use the &quot;unsubscribe&quot; link or write to us);</li>
              <li>nominate another person to exercise your rights in case of death or incapacity, as provided under the DPDP Act; and</li>
              <li>raise a grievance with us.</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed pt-1 text-left sm:text-justify [text-justify:inter-word]">
              To exercise any of these rights, email us at{' '}
              <a
                href="mailto:houseofurvaah@yahoo.com"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
              >
                houseofurvaah@yahoo.com
              </a>
              . We will respond within a reasonable time and, in any case, within the period required by law.
            </p>
          </div>

          {/* 10. CHILDREN */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              10. Children
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              The Platform is not intended for anyone under 18. We do not knowingly collect personal data from children without the verifiable consent of a parent or guardian. If you believe a child has given us personal data, please contact us and we will delete it.
            </p>
          </div>

          {/* 11. THIRD-PARTY LINKS */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              11. Third-Party Links
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              The Platform may link to third-party websites (such as social media). We are not responsible for their privacy practices; please read their policies before sharing any information with them.
            </p>
          </div>

          {/* 12. CHANGES TO THIS POLICY */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              12. Changes to This Policy
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top of this policy shows the latest version. Continued use of the Platform after changes are posted means you accept the updated policy.
            </p>
          </div>

          {/* 13. CONTACT US */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              13. Contact Us
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              For any privacy-related questions, concerns, or requests, please reach out to our Grievance Officer at:
            </p>
            <div className="space-y-2 text-neutral-700 leading-relaxed text-left">
              <p>
                <span className="font-semibold text-neutral-900">Grievance Inquiries:</span>{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  houseofurvaah@yahoo.com
                </a>
              </p>
              <p>
                <span className="font-semibold text-neutral-900">Customer Support:</span>{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  houseofurvaah@yahoo.com
                </a>
              </p>
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
