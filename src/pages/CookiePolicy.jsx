import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';

export const CookiePolicy = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-20 pb-16 md:pt-28 md:pb-24 overflow-x-hidden">
      <SEOHead
        title="Cookie Policy | House of Urvaah"
        description="Learn how House of Urvaah uses cookies and similar tracking technologies to personalize your shopping experience and optimize store performance."
        keywords="House of Urvaah cookie policy, browser cookies, analytics, tracking settings, privacy"
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-2">
            COOKIE POLICY
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-serif italic mb-4">
            Last updated: November 24, 2026
          </p>
          <div className="w-12 h-[1px] bg-neutral-900/30" />
        </motion.div>
      </section>

      {/* 2. POLICY DOCUMENT CONTENT */}
      <section className="w-full max-w-[960px] mx-auto px-4 sm:px-8 md:px-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 sm:space-y-10 md:space-y-12 text-neutral-700 leading-relaxed font-light text-sm sm:text-base font-serif text-left sm:text-justify [text-justify:inter-word] break-words"
        >
          {/* INTRODUCTORY PARAGRAPHS */}
          <div className="space-y-3 sm:space-y-4 pb-6 sm:pb-8 border-b border-neutral-200">
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              House of Urvaah (&quot;House of Urvaah&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) uses cookies and similar technologies on our website and mobile application (the &quot;Platform&quot;) to help it run smoothly and to give you a better shopping experience. This Cookie Policy explains what cookies are, why we use them, and how you can manage your preferences.
            </p>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              This policy should be read alongside our{' '}
              <Link
                to="/privacy-policy"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/terms-and-conditions"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                Terms &amp; Conditions
              </Link>
              . By continuing to browse or shop on the Platform, or by accepting cookies through our cookie banner (where shown), you agree to our use of cookies as described here — except for cookies that are strictly necessary for the Platform to work, which don&apos;t require your consent.
            </p>
          </div>

          {/* SECTION 1 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              1. What Are Cookies?
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Cookies are small text files placed on your device (computer, phone or tablet) when you visit a website or use an app. They help the Platform remember who you are, keep track of items in your bag, save your preferences, and generally make your visit smoother the next time you come back.
            </p>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We also use similar technologies such as pixels, local storage, and software development kits (SDKs) where applicable. For simplicity, we refer to all of these collectively as &quot;cookies&quot; in this policy.
            </p>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Cookies can be:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
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
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              2. Why House of Urvaah Uses Cookies
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We use cookies to:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
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
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              3. Types of Cookies We Use
            </h2>
            <div className="overflow-x-auto my-4 sm:my-6 border border-neutral-200 rounded-sm bg-white">
              <table className="w-full text-left text-xs sm:text-sm font-serif border-collapse min-w-[580px]">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-900">
                    <th className="py-3 sm:py-3.5 px-3.5 sm:px-6 font-semibold tracking-wider uppercase text-[10px] sm:text-xs w-[28%] border-r border-neutral-200">
                      Category
                    </th>
                    <th className="py-3 sm:py-3.5 px-3.5 sm:px-6 font-semibold tracking-wider uppercase text-[10px] sm:text-xs w-[46%] border-r border-neutral-200">
                      What They Do
                    </th>
                    <th className="py-3 sm:py-3.5 px-3.5 sm:px-6 font-semibold tracking-wider uppercase text-[10px] sm:text-xs w-[26%]">
                      Can You Turn Them Off?
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-semibold text-neutral-900 align-top border-r border-neutral-200">
                      Strictly Necessary Cookies
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed border-r border-neutral-200">
                      Essential for the website to work. They handle core features like remembering items in your bag, secure checkout, account login, and network security.
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed">
                      <span className="font-semibold text-neutral-900">No</span> — these cannot be switched off, as the website wouldn&apos;t work properly without them.
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-semibold text-neutral-900 align-top border-r border-neutral-200">
                      Performance &amp; Analytics Cookies
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed border-r border-neutral-200">
                      Help us understand how visitors interact with the Platform (e.g. which pages are visited most, how long people stay, if any errors occur). All data is aggregated and anonymous.
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed">
                      <span className="font-semibold text-neutral-900">Yes</span> — optional via your browser settings.
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-semibold text-neutral-900 align-top border-r border-neutral-200">
                      Functionality Cookies
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed border-r border-neutral-200">
                      Remember the choices you make to provide a more tailored experience — such as your saved delivery pin code, size filters, currency, or preferred view.
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed">
                      <span className="font-semibold text-neutral-900">Yes</span> — optional via your browser settings.
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-semibold text-neutral-900 align-top border-r border-neutral-200">
                      Targeting &amp; Marketing Cookies
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed border-r border-neutral-200">
                      Used to show you products and offers you might like on our Platform and on third-party sites. They also help limit how many times you see an ad and measure the effectiveness of our campaigns.
                    </td>
                    <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 align-top leading-relaxed">
                      <span className="font-semibold text-neutral-900">Yes</span> — optional via your browser settings or ad network opt-outs.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              4. Managing Your Cookie Preferences
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              You have full control over non-essential cookies. Here is how you can manage them:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>
                <strong className="font-semibold text-neutral-900">Through your browser:</strong> Most browsers allow you to view, manage, delete, and block cookies through their settings. You can set your browser to reject all cookies, or to alert you whenever a cookie is being placed.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Opting out of Google Analytics:</strong> You can prevent Google Analytics from collecting data across websites by installing the Google Analytics Opt-Out Browser Add-on.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Opting out of interest-based ads:</strong> You can opt out of personalized ads from participating ad networks via the Digital Advertising Alliance (aboutads.info/choices) or Network Advertising Initiative (optout.networkadvertising.org).
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Mobile device settings:</strong> On iOS and Android devices, you can manage tracking and ad personalization through your device&apos;s privacy settings (e.g. &quot;Ask App Not to Track&quot; on iOS or &quot;Opt out of Ads Personalization&quot; on Android).
              </li>
            </ul>
            <div className="border-l-2 border-neutral-900 pl-4 sm:pl-5 py-1 text-xs sm:text-sm text-neutral-600 leading-relaxed italic my-2 text-left sm:text-justify [text-justify:inter-word]">
              Please note that if you disable or block cookies, some parts of the Platform (such as saving items to your bag or staying logged in) may not function as intended.
            </div>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              5. Third-Party Cookies
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Some cookies on our Platform are set by third-party services we work with. These may include:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Analytics providers (such as Google Analytics) to help us understand site traffic and usage patterns;</li>
              <li>Payment gateways to ensure secure and seamless transactions;</li>
              <li>Social media platforms (such as Instagram or Pinterest) when you use share features or view integrated content; and</li>
              <li>Advertising partners to deliver relevant House of Urvaah ads across other sites and platforms.</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word] pt-1">
              These third parties have their own privacy and cookie policies, and we encourage you to review them directly.
            </p>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              6. Updates to This Cookie Policy
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We may update this Cookie Policy periodically to reflect changes in our use of cookies or applicable regulations. When changes are made, we will update the &quot;Last updated&quot; date at the top of this page. We encourage you to review this page periodically to stay informed about how we use cookies.
            </p>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              7. Legal &amp; Compliance Disclaimer
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              This Cookie Policy is provided as a starting draft based on standard e-commerce practices and is not a substitute for legal advice. Before publishing, have it reviewed by a qualified legal professional to ensure it accurately reflects House of Urvaah&apos;s actual cookie usage, tracking technologies, and compliance obligations under applicable data protection regulations.
            </p>
          </div>

          {/* SECTION 8 */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              8. Contact Us
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              If you have any questions about our use of cookies or this Cookie Policy, please reach out to us:
            </p>
            <div className="bg-neutral-50 p-4 sm:p-6 border border-neutral-200 space-y-2 text-xs sm:text-sm text-neutral-700 text-left">
              <p>
                <strong className="font-semibold text-neutral-900">Direct Inquiries:</strong>{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  houseofurvaah@yahoo.com
                </a>
              </p>
              <p>
                <strong className="font-semibold text-neutral-900">Customer Support:</strong>{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  houseofurvaah@yahoo.com
                </a>
              </p>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed pt-2 text-left sm:text-justify [text-justify:inter-word]">
              For more details on how House of Urvaah protects your personal information, please refer to our{' '}
              <Link
                to="/privacy-policy"
                className="underline underline-offset-4 font-normal hover:text-neutral-900 transition-colors"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/terms-and-conditions"
                className="underline underline-offset-4 font-normal hover:text-neutral-900 transition-colors"
              >
                Terms &amp; Conditions
              </Link>
              .
            </p>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default CookiePolicy;
