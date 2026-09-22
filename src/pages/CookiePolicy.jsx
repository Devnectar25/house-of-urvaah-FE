import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export const CookiePolicy = () => {
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
            DATA &amp; PRIVACY
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-wider uppercase text-[#111111] mb-6">
            COOKIE POLICY
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
              House of Urvaah (&quot;House of Urvaah&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) uses cookies and similar technologies on our website and mobile application (the &quot;Platform&quot;) to help it run smoothly and to give you a better shopping experience. This Cookie Policy explains what cookies are, why we use them, and how you can manage your preferences.
            </p>
            <p>
              This policy should be read alongside our Privacy Policy and Terms &amp; Conditions. By continuing to browse or shop on the Platform, or by accepting cookies through our cookie banner (where shown), you agree to our use of cookies as described here — except for cookies that are strictly necessary for the Platform to work, which don&apos;t require your consent.
            </p>
          </div>

          {/* SECTION 1 */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device (computer, phone or tablet) when you visit a website or use an app. They help the Platform remember who you are, keep track of items in your bag, save your preferences, and generally make your visit smoother the next time you come back.
            </p>
            <p>
              We also use similar technologies such as pixels, local storage, and software development kits (SDKs) where applicable. For simplicity, we refer to all of these collectively as &quot;cookies&quot; in this policy.
            </p>
            <p>
              Cookies can be:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Session cookies</strong> — temporary, and deleted automatically once you close your browser.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Persistent cookies</strong> — stay on your device for a set period, or until you delete them.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">First-party cookies</strong> — set directly by House of Urvaah.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Third-party cookies</strong> — set by external services we use to help run or improve the Platform (see Section 5).
              </li>
            </ul>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              2. Why House of Urvaah Uses Cookies
            </h2>
            <p>
              We use cookies to:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                Keep the Platform running smoothly — for example, keeping you logged in and remembering what&apos;s in your shopping bag as you browse;
              </li>
              <li>
                Make checkout quick and secure;
              </li>
              <li>
                Remember your preferences, such as saved addresses, sizes, or wishlist items, so you don&apos;t have to re-enter them each time;
              </li>
              <li>
                Understand how visitors use our website, so we can improve navigation, page layout, and overall shopping experience;
              </li>
              <li>
                Show you relevant product recommendations and, where applicable, personalized offers or advertisements; and
              </li>
              <li>
                Measure the performance of our marketing campaigns and website features.
              </li>
            </ul>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              3. Types of Cookies We Use
            </h2>

            {/* RESPONSIVE STYLED HTML TABLE */}
            <div className="overflow-x-auto my-6 border border-neutral-200 rounded-sm">
              <table className="w-full text-left text-xs sm:text-sm font-serif border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-900">
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-1/4">
                      Category
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-1/2">
                      What It Does
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-1/4">
                      Your Choice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">
                      Strictly Necessary
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Essential for core functions like account login, security, keeping items in your shopping bag, and completing checkout. The Platform cannot function properly without these.
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Always active — cannot be switched off.
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">
                      Functional / Preference
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Remembers your choices, such as saved sizes, delivery address, language, or region, to personalize your experience.
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Optional — set with your consent.
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">
                      Analytics / Performance
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Helps us understand how visitors use the Platform — which pages are popular, how people navigate, and where they may run into issues — so we can improve the site. This data is generally viewed in aggregate.
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Optional — set with your consent.
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">
                      Advertising / Marketing
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Used to show you relevant ads on our Platform and elsewhere, and to measure how well our marketing campaigns perform.
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      Optional — set with your consent.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              4. How Cookies Improve Your Shopping Experience
            </h2>
            <p>
              Cookies play a quiet but important role behind the scenes — they&apos;re what let you add an item to your bag and have it still be there when you come back later, keep you logged into your account across visits, remember your size preferences for faster future shopping, and help us fix broken pages or confusing layouts by showing us (in aggregate, anonymized form) how people actually use the site.
            </p>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              5. Third-Party Cookies &amp; Services
            </h2>
            <p>
              We may work with trusted third-party service providers who help us operate the Platform, understand our traffic, process payments, and run marketing campaigns. These providers may set their own cookies when you visit our site — for example: [Insert Third-Party Service, e.g. Google Analytics, Meta Pixel, payment gateway providers, or other tools actually used by House of Urvaah].
            </p>
            <p>
              We do not control the cookies set by these third parties, and this policy does not cover their individual privacy or cookie practices. We recommend reviewing their respective privacy and cookie policies directly for more detail on how they handle your data.
            </p>
            <p>
              If we use any third-party advertising or retargeting service to show you House of Urvaah products on other websites or platforms after you&apos;ve visited our site, this will also rely on cookies from that service provider.
            </p>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              6. Cookie Duration
            </h2>
            <p>
              Cookies used on our Platform may last for different lengths of time depending on their purpose:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Session cookies:</strong> deleted automatically when you close your browser.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Persistent cookies:</strong> retained for [Insert Cookie Duration], after which they expire automatically unless renewed by continued use of the site.
              </li>
            </ul>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              7. Managing Your Cookie Preferences
            </h2>
            <p>
              You&apos;re always in control of your cookie preferences. Here&apos;s how:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Cookie consent banner:</strong> Where shown on the Platform, you can accept or decline optional (non-essential) cookies at any time through our cookie banner or preferences tool.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Browser settings:</strong> Most browsers let you view, block, or delete cookies through their settings menu. Check your browser&apos;s help section for step-by-step instructions, as this varies by browser (Chrome, Safari, Firefox, Edge, etc.).
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Device settings:</strong> On mobile devices, you can manage app-tracking and advertising permissions through your phone or tablet&apos;s privacy settings.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Account preferences:</strong> You can update your marketing communication preferences anytime from your House of Urvaah account settings, as described in our Privacy Policy.
              </li>
            </ul>
            <p>
              Please note that strictly necessary cookies cannot be disabled, since the Platform relies on them to function. Blocking or deleting other cookies may affect your experience — for example, you may be logged out unexpectedly, lose items from your shopping bag, or see less relevant product recommendations.
            </p>
          </div>

          {/* SECTION 8 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              8. Consent
            </h2>
            <p>
              When you first visit the Platform, you may be shown a cookie consent banner allowing you to accept or customize which optional cookies you&apos;re comfortable with. You can change your preferences at any time by [Insert Details — e.g. &quot;revisiting the cookie settings link in our footer&quot; or the actual mechanism used on the site].
            </p>
          </div>

          {/* SECTION 9 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              9. Changes to This Cookie Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in the cookies and technologies we use, or to comply with new legal requirements. Any updates will be posted on this page with a revised effective date, and where required, we&apos;ll notify you before significant changes take effect.
            </p>
          </div>

          {/* SECTION 10 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              10. Questions About This Policy
            </h2>
            <p>
              If you have any questions about how we use cookies, feel free to reach out:
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">Email:</strong> [Insert Email Address]
            </p>
          </div>

          {/* LEGAL REVIEW DISCLAIMER */}
          <div className="pt-6 border-t border-neutral-200">
            <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-600 rounded-sm italic leading-relaxed">
              This Cookie Policy is provided as a starting draft and should be reviewed by a qualified legal professional before publishing, to ensure it accurately reflects the specific cookies, third-party tools, and tracking technologies actually used on the House of Urvaah website, and complies with applicable data protection law (including the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000, if operating in India).
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};
