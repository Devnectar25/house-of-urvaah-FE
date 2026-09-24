import React from 'react';
import { motion } from 'framer-motion';
import {
  Cookie,
  Target,
  Layers,
  Settings,
  Share2,
  RefreshCw,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export const CookiePolicy = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-20 md:pt-32 md:pb-28 overflow-x-hidden">
      {/* 1. HERO HEADER */}
      <section className="w-full max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="px-3.5 py-1 bg-neutral-100 text-neutral-800 text-[10px] sm:text-xs font-serif font-semibold rounded-full uppercase tracking-[0.25em] mb-3 inline-block">
            DATA &amp; PRIVACY
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-6">
            COOKIE POLICY
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
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Cookie className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                1. What Are Cookies?
              </h2>
            </div>
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
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Target className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                2. Why House of Urvaah Uses Cookies
              </h2>
            </div>
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
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Layers className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                3. Types of Cookies We Use
              </h2>
            </div>

            {/* RESPONSIVE STYLED HTML TABLE */}
            <div className="overflow-x-auto my-6 border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm font-serif border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-900">
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-1/4">
                      Category
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-1/2">
                      What They Do
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-1/4">
                      Can You Turn Them Off?
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">Strictly Necessary Cookies</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">Essential for the website to work. They handle core features like remembering items in your bag, secure checkout, account login, and network security.</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top text-neutral-500 italic">No — these cannot be switched off, as the website wouldn&apos;t work properly without them.</td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">Performance &amp; Analytics Cookies</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">Help us understand how visitors interact with the Platform (e.g. which pages are visited most, how long people stay, if any errors occur). All data is aggregated and anonymous.</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top text-neutral-700 font-medium">Yes — optional via your browser settings.</td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">Functionality Cookies</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">Remember the choices you make to provide a more tailored experience — such as your saved delivery pin code, size filters, currency, or preferred view.</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top text-neutral-700 font-medium">Yes — optional via your browser settings.</td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 align-top">Targeting &amp; Marketing Cookies</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top">Used to show you products and offers you might like on our Platform and on third-party sites. They also help limit how many times you see an ad and measure the effectiveness of our campaigns.</td>
                    <td className="py-3.5 px-4 sm:px-6 align-top text-neutral-700 font-medium">Yes — optional via your browser settings or ad network opt-outs.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Settings className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                4. Managing Your Cookie Preferences
              </h2>
            </div>
            <p>
              You have full control over non-essential cookies. Here is how you can manage them:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Through your browser:</strong> Most browsers allow you to view, manage, delete, and block cookies through their settings. You can set your browser to reject all cookies, or to alert you whenever a cookie is being placed. Please note that if you disable or block cookies, some parts of the Platform (such as saving items to your bag or staying logged in) may not function as intended.
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
          </div>

          {/* SECTION 5 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Share2 className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                5. Third-Party Cookies
              </h2>
            </div>
            <p>
              Some cookies on our Platform are set by third-party services we work with. These may include:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Analytics providers (such as Google Analytics) to help us understand site traffic and usage patterns;</li>
              <li>Payment gateways to ensure secure and seamless transactions;</li>
              <li>Social media platforms (such as Instagram or Pinterest) when you use share features or view integrated content; and</li>
              <li>Advertising partners to deliver relevant House of Urvaah ads across other sites and platforms.</li>
            </ul>
            <p>
              These third parties have their own privacy and cookie policies, and we encourage you to review them directly.
            </p>
          </div>

          {/* 2-COLUMN PLAIN GRID FOR SECTIONS 6 & 8 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
            {/* SECTION 6 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                  <RefreshCw className="w-4 h-4 text-neutral-900" />
                </div>
                <h3 className="text-base font-serif font-bold text-neutral-900 uppercase tracking-wide">
                  6. Updates to This Cookie Policy
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                We may update this Cookie Policy periodically to reflect changes in our use of cookies or applicable regulations. When changes are made, we will update the &quot;Effective Date&quot; at the top of this page. We encourage you to review this page periodically to stay informed about how we use cookies.
              </p>
            </div>

            {/* SECTION 8 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-neutral-900" />
                </div>
                <h3 className="text-base font-serif font-bold text-neutral-900 uppercase tracking-wide">
                  8. Legal &amp; Compliance Disclaimer
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                This Cookie Policy is provided as a starting draft based on standard e-commerce practices and is not a substitute for legal advice. Before publishing, have it reviewed by a qualified legal professional to ensure it accurately reflects House of Urvaah&apos;s actual cookie usage, tracking technologies, and compliance obligations under applicable data protection regulations.
              </p>
            </div>
          </div>

          {/* SECTION 7 - CONTACT US WITH 2-COLUMN STRUCTURED CARD */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Mail className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                7. Contact Us
              </h2>
            </div>
            <p>
              If you have any questions about our use of cookies or this Cookie Policy, please reach out to us:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-6 rounded-xl border border-neutral-200 text-xs sm:text-sm">
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Direct Inquiries</p>
                <p className="font-semibold text-neutral-900">Email: [Insert Email Address]</p>
              </div>
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Customer Support</p>
                <p className="font-semibold text-neutral-900">Support: [support@houseofurvaah.com]</p>
              </div>
            </div>
          </div>

          {/* CLOSING LEGAL NOTICE NESTED BOTTOM BANNER */}
          <div className="border-t border-neutral-200 pt-8 mt-12 bg-neutral-50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 md:-mx-14 md:-mb-14 p-6 sm:p-10 rounded-b-2xl text-center space-y-3">
            <div className="max-w-3xl mx-auto text-xs sm:text-sm text-neutral-600 italic leading-relaxed">
              For more details on how House of Urvaah protects your personal information, please refer to our Privacy Policy and Terms &amp; Conditions.
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default CookiePolicy;
