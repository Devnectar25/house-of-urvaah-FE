import React from 'react';
import { motion } from 'framer-motion';
import { SEOHead } from '../components/common/SEOHead';

export const PrivacyPolicy = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-20 pb-16 md:pt-28 md:pb-24 overflow-x-hidden">
      <SEOHead
        title="Privacy Policy | House of Urvaah"
        description="Read the official House of Urvaah Privacy Policy to learn how we collect, handle, and safeguard your personal information and shopping security."
        keywords="House of Urvaah privacy policy, data security, customer privacy, legal terms"
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
            Last updated: November 24, 2026
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
          <div className="space-y-5 pb-6 sm:pb-8 border-b border-neutral-200 text-left sm:text-justify [text-justify:inter-word]">
            <p>
              This Privacy Policy applies to our practices in connection with the House of Urvaah online store, available on the website www.houseofurvaah.com and any associated store pages or mobile application (the &quot;Platform&quot; or &quot;House of Urvaah&quot;). It describes how House of Urvaah (&quot;House of Urvaah&quot;, the &quot;Company&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) collects, uses, shares, stores and protects information when you (the &quot;User&quot;, &quot;Customer&quot; or &quot;you&quot;) access the Platform or purchase products through it.
            </p>
            <p>
              Protecting your privacy is a priority. Any personal information you voluntarily provide will be treated with a high standard of security and confidentiality and used strictly for the purposes described in this Privacy Policy. By accessing the Platform or placing an order, you consent to the data practices described here. This Privacy Policy should be read together with the Terms &amp; Conditions, the Shipping Information, the Returns &amp; Exchanges Policy, and the Cookie Settings.
            </p>
          </div>

          {/* SECTION 1 */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              1. Information We Collect
            </h2>
            <div className="space-y-1.5 text-left sm:text-justify [text-justify:inter-word]">
              <p className="font-semibold text-neutral-900 text-left">
                Payment information:
              </p>
              <p>
                We do not store your full card number, CVV, UPI PIN or net-banking credentials. We may receive limited details such as payment status, transaction ID and the last four digits of your card.
              </p>
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              2. Legal Basis and Consent
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We process your personal data based on your consent, to perform our contract with you (fulfilling your order), and to meet legal obligations, in line with the Information Technology Act, 2000, the rules made under it, and the Digital Personal Data Protection Act, 2023, as applicable. You may withdraw consent at any time by contacting us; withdrawal does not affect processing already done, and may limit our ability to fulfil some services.
            </p>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              3. Who We Share Your Information With
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We do not sell your personal information. We share it only with:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Courier and logistics partners to deliver your order</li>
              <li>Payment gateways to process payments and refunds</li>
            </ul>
            <div className="pt-2 sm:pt-3 space-y-1.5">
              <h3 className="text-sm sm:text-base font-serif font-semibold text-neutral-900 text-left">
                Data retention
              </h3>
              <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
                We keep personal data only as long as needed for the purposes above, or as required by law (for example, tax and invoice records are retained for the period required under Indian law). After that, we delete or anonymise it.
              </p>
            </div>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              4. Data Security
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We use reasonable security practices, including SSL/HTTPS encryption and access controls. No method of transmission over the internet is completely secure, so we cannot guarantee absolute security. Please keep your account password confidential.
            </p>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              5. Your Rights
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left">
              Subject to applicable law, you may:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Access the personal data we hold about you;</li>
              <li>Ask us to correct or update inaccurate data;</li>
              <li>Ask us to delete your data (except where we must retain it by law);</li>
              <li>Withdraw consent or opt out of marketing messages (use the &quot;unsubscribe&quot; link or write to us);</li>
              <li>Nominate another person to exercise your rights in case of death or incapacity, as provided under the DPDP Act;</li>
              <li>Raise a grievance with us.</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed pt-1 text-left">
              To exercise these rights, email{' '}
              <a
                href="mailto:houseofurvaah@yahoo.com"
                className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal"
              >
                houseofurvaah@yahoo.com
              </a>
              . We will respond within a reasonable time and in any case within the period required by law.
            </p>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              6. Children
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Our Website is not intended for anyone under 18. We do not knowingly collect personal data from children without verifiable consent of a parent or guardian. If you believe a child has given us data, please contact us and we will delete it.
            </p>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              7. Third-Party Links
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              The Website may link to third-party sites (such as social media). We are not responsible for their privacy practices; please read their policies.
            </p>
          </div>

          {/* CHANGES TO THIS POLICY */}
          <div className="pt-6 sm:pt-8 border-t border-neutral-200">
            <div className="border-l-2 border-neutral-900 pl-4 sm:pl-5 py-1 text-xs sm:text-sm text-neutral-600 leading-relaxed italic text-left sm:text-justify [text-justify:inter-word]">
              Changes to this policy: We may update this policy from time to time. The &quot;Last updated&quot; date above shows the latest version. Continued use of the Website means you accept the changes.
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
