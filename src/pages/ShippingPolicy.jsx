import React from 'react';
import { motion } from 'framer-motion';
import {
  Info,
  MapPin,
  Clock,
  Truck,
  CreditCard,
  Search,
  PackageCheck,
  AlertCircle,
  RotateCcw,
  CloudRain,
  ShieldAlert,
  XCircle,
  Boxes,
  Ban,
  Lock,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const ShippingPolicy = () => {
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
            ORDERS &amp; FULFILMENT
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-6">
            SHIPPING &amp; DELIVERY POLICY
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
          {/* SECTION 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Info className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                1. Introduction &amp; Scope
              </h2>
            </div>
            <p>
              House of Urvaah (&quot;House of Urvaah&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an online fashion retailer offering women&apos;s clothing, apparel and accessories (&quot;Products&quot;) through our website and mobile application (the &quot;Platform&quot;). This Shipping &amp; Delivery Policy (&quot;Policy&quot;) explains how orders placed on the Platform are processed, packed, dispatched and delivered to you (the &quot;Customer&quot;, &quot;User&quot; or &quot;you&quot;).
            </p>
            <p>
              This Policy forms part of our Terms &amp; Conditions and should be read together with our Returns &amp; Exchanges Policy and Privacy Policy. By placing an order on the Platform, you agree to the terms of this Policy.
            </p>
            <p>
              Orders are dispatched from our fulfilment center(s) and delivered by our independent third-party logistics and courier partners (&quot;Delivery Partners&quot;). Delivery Partners are independent service providers responsible for the physical transport and handover of your order.
            </p>
            <p>
              This Policy may be updated from time to time to reflect changes in our operations or our Delivery Partners&apos; capabilities. The version in effect at the time you place your order will apply to that order.
            </p>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <MapPin className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                2. Serviceable Areas
              </h2>
            </div>
            <p>
              We currently deliver to serviceable pin codes within [Insert Details — e.g. India / specific states]. At checkout, simply enter your delivery pin code and the Platform will confirm whether we currently deliver to your area, along with the applicable delivery estimate and shipping charges.
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Delivery availability, timelines and charges may vary depending on your location.</li>
              <li>Some remote or restricted-access locations may have longer delivery windows or may not be serviceable at this time.</li>
              <li>We may, from time to time, add or remove serviceable areas without prior notice, based on operational or logistics requirements.</li>
            </ul>
            <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 rounded-xl">
              <p>
                <strong className="font-semibold text-neutral-900">International shipping:</strong> [Insert Details — currently available / not currently available / list of countries].
              </p>
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Clock className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                3. Order Processing Time
              </h2>
            </div>
            <p>
              Once your order is placed and payment is confirmed, it goes through a quick quality check before being packed and handed over to our Delivery Partner.
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Orders are typically processed within [Insert Details, e.g. 1–2 business days] of order confirmation.</li>
              <li>Orders placed after [Insert Details, e.g. cut-off time] or on weekends/public holidays will begin processing on the next business day.</li>
              <li>During sale periods, festive seasons or new-collection launches, processing times may take slightly longer than usual due to higher order volumes. We appreciate your patience during these times.</li>
              <li>You will receive an order confirmation email/SMS once your order is placed, and a dispatch confirmation with tracking details once it leaves our facility.</li>
            </ul>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Truck className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                4. Shipping Timelines
              </h2>
            </div>
            <p>
              Once dispatched, estimated delivery timelines depend on your location:
            </p>

            {/* RESPONSIVE STYLED HTML TABLE */}
            <div className="overflow-x-auto my-6 border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm font-serif border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-900">
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs">
                      Delivery Zone
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs">
                      Estimated Delivery Time (from dispatch)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-neutral-900">Metro cities</td>
                    <td className="py-3.5 px-4 sm:px-6">[Insert Details, e.g. 2–4 business days]</td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-neutral-900">Other cities/towns</td>
                    <td className="py-3.5 px-4 sm:px-6">[Insert Details, e.g. 4–7 business days]</td>
                  </tr>
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-neutral-900">Remote/rural areas</td>
                    <td className="py-3.5 px-4 sm:px-6">[Insert Details, e.g. 7–10 business days]</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              These timelines are estimates only and are not guaranteed delivery dates. Actual delivery may be affected by your exact location, weather conditions, regional holidays, courier network delays, or circumstances beyond our control (see Section 10 — Delays &amp; Force Majeure).
            </p>
            <p>
              The estimated delivery window shown at checkout is based on the information available at the time of order and excludes the order processing time described in Section 3.
            </p>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <CreditCard className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                5. Shipping Charges
              </h2>
            </div>
            <p>
              Shipping charges, if applicable, are calculated based on your delivery location and the value of your order, and will always be clearly displayed at checkout before you complete your purchase — there are no hidden shipping costs.
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Free shipping:</strong> [Insert Details — e.g. &quot;Enjoy free standard shipping on all orders above ₹__&quot; or &quot;Free shipping currently available on all orders&quot;].
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Shipping charges for orders below the free-shipping threshold, if any:</strong> [Insert Details].
              </li>
              <li>Any promotional or discounted shipping offers will be clearly communicated at checkout and are subject to the specific terms of that offer.</li>
              <li>Shipping charges (where applicable) are non-refundable except in cases where the return or non-delivery is due to an error on our part, as detailed in our Returns &amp; Exchanges Policy.</li>
            </ul>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Search className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                6. Order Tracking
              </h2>
            </div>
            <p>
              Once your order is dispatched, you will receive a tracking link via email and/or SMS. You can also track your order at any time by:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Visiting the &quot;Track Order&quot; section on the Platform, or</li>
              <li>Logging into your House of Urvaah account and viewing your order history.</li>
            </ul>
            <p>
              Please allow up to [Insert Details, e.g. 24 hours] after dispatch for tracking information to update on the courier&apos;s system.
            </p>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <PackageCheck className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                7. Delivery Process
              </h2>
            </div>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Our Delivery Partner will make reasonable attempts (typically up to [Insert Details, e.g. 2–3] attempts) to deliver your order to the address provided at checkout.</li>
              <li>Someone should be available at the delivery address during the estimated delivery window to receive the package.</li>
              <li>For certain orders, the Delivery Partner may request an OTP, signature or other confirmation to verify successful delivery. Please keep any delivery OTP confidential and share it only with the delivery agent at the time of delivery.</li>
              <li>You may authorize another adult at your delivery address to receive the order on your behalf; delivery to and acceptance by such a person will be considered valid delivery.</li>
              <li>Once delivery is confirmed (via signature, OTP or courier confirmation), the order is considered successfully delivered.</li>
            </ul>
          </div>

          {/* SECTION 8 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <AlertCircle className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                8. Incorrect or Incomplete Address
              </h2>
            </div>
            <p>
              Please double-check your shipping address, pin code and contact number before confirming your order, as this helps us ensure a smooth delivery experience.
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>If an order cannot be delivered due to an incorrect, incomplete or unreachable address provided by you, it may be returned to our fulfilment center.</li>
              <li>In such cases, we will contact you to arrange re-shipment. Additional shipping charges may apply for re-shipping orders returned due to incorrect address details provided at checkout.</li>
              <li>If you need to update your delivery address after placing an order, please contact our support team as soon as possible at [Insert Contact Email] — we&apos;ll try our best to accommodate the change if the order hasn&apos;t already been dispatched, though we cannot guarantee this.</li>
            </ul>
          </div>

          {/* SECTION 9 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <RotateCcw className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                9. Failed Delivery Attempts &amp; Return to Origin
              </h2>
            </div>
            <p>
              If our Delivery Partner is unable to deliver your order after reasonable attempts — for example, if you are unavailable, the address is inaccessible, or delivery is declined — the order may be sent back to our fulfilment center (&quot;Return to Origin&quot;).
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>We will notify you if this happens and try to coordinate a re-delivery or discuss next steps.</li>
              <li>Refunds (where applicable) for orders returned due to failed delivery are handled in accordance with our Returns &amp; Exchanges Policy. Please note that original shipping charges may not be refundable where the failed delivery was not due to an error on our part.</li>
            </ul>
          </div>

          {/* SECTION 10 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <CloudRain className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                10. Delays &amp; Force Majeure
              </h2>
            </div>
            <p>
              While we work closely with our Delivery Partners to ensure timely delivery, delays can occasionally occur due to circumstances beyond our reasonable control, including but not limited to:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Severe weather conditions or natural events;</li>
              <li>Regional strikes, transport disruptions or public holidays;</li>
              <li>Courier network congestion during high-demand periods (e.g. sale events, festive seasons);</li>
              <li>Government restrictions or regulatory action; or</li>
              <li>Other events beyond our reasonable control.</li>
            </ul>
            <p>
              In such circumstances, House of Urvaah and its Delivery Partners will not be held liable for delays, but we will make reasonable efforts to keep you informed and to complete delivery as soon as reasonably possible.
            </p>
          </div>

          {/* SECTION 11 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <ShieldAlert className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                11. Receiving Your Order — Damaged or Tampered Packages
              </h2>
            </div>
            <p>
              We take great care in packaging your order to ensure it reaches you in perfect condition. However, in the rare event that your package arrives visibly damaged or tampered with:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>We recommend inspecting the outer packaging at the time of delivery, and if it appears significantly damaged or tampered with, you may choose to refuse the delivery.</li>
              <li>If you&apos;ve already accepted the package and later notice damage, please take clear photographs/videos of the packaging and the product, and reach out to us within [Insert Details, e.g. 48 hours] of delivery at [Insert Contact Email].</li>
              <li>Eligible damaged, defective or incorrect-item claims will be addressed through our Returns &amp; Exchanges Policy, which outlines the process for replacement, exchange or refund.</li>
            </ul>
          </div>

          {/* 2-COLUMN GRID FOR RELATED SHORT SUBSECTIONS: 12 & 13 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
            {/* SECTION 12 */}
            <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-neutral-200/60 rounded-full text-neutral-900 shrink-0">
                  <XCircle className="w-4 h-4 text-neutral-900" />
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-900 uppercase tracking-wide">
                  12. Order Cancellations Before Dispatch
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                If you wish to cancel your order before it has been dispatched, please refer to our Returns &amp; Exchanges Policy for the applicable process and timelines. Once an order has been dispatched, it cannot be cancelled, but you may be eligible for a return in accordance with that policy.
              </p>
            </div>

            {/* SECTION 13 */}
            <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-neutral-200/60 rounded-full text-neutral-900 shrink-0">
                  <Boxes className="w-4 h-4 text-neutral-900" />
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-900 uppercase tracking-wide">
                  13. Multiple Items &amp; Split Shipments
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                If your order contains multiple items, they may occasionally be shipped separately (in more than one package) depending on stock location and availability, at no extra cost to you. You will be notified separately for each shipment with its own tracking details.
              </p>
            </div>
          </div>

          {/* SECTION 14 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <Ban className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                14. Restricted Shipping
              </h2>
            </div>
            <p>
              We reserve the right to decline or cancel an order if the delivery location is not serviceable, if the order appears fraudulent, or if shipping the order would violate applicable law or our Delivery Partners&apos; policies. In such cases, you will be notified and any amount paid will be refunded in accordance with our Returns &amp; Exchanges Policy.
            </p>
            <p>
              Orders placed on the Platform are intended for personal use only and not for resale or commercial redistribution.
            </p>
          </div>

          {/* 2-COLUMN PLAIN GRID FOR SECTIONS 15 & 16 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
            {/* SECTION 15 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                  <Lock className="w-4 h-4 text-neutral-900" />
                </div>
                <h3 className="text-base font-serif font-bold text-neutral-900 uppercase tracking-wide">
                  15. Your Information &amp; Privacy
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                To fulfil and deliver your order, we share the minimum necessary information (such as your name, delivery address, phone number and order details) with our Delivery Partners, strictly for the purpose of delivery, verification, and coordination. This is handled in accordance with our Privacy Policy.
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                By placing an order, you consent to receiving delivery-related communications (SMS, email, in-app notifications and/or calls) necessary to coordinate and complete your delivery.
              </p>
            </div>

            {/* SECTION 16 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                  <FileText className="w-4 h-4 text-neutral-900" />
                </div>
                <h3 className="text-base font-serif font-bold text-neutral-900 uppercase tracking-wide">
                  16. Changes to This Policy
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                We may update this Shipping &amp; Delivery Policy from time to time to reflect changes in our shipping processes, partners, or applicable regulations. The updated policy will be posted on this page with a revised effective date. We encourage you to review this page periodically.
              </p>
            </div>
          </div>

          {/* SECTION 17 - NEED HELP WITH 2-COLUMN STRUCTURED CARD */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2 sm:p-2.5 bg-neutral-100 rounded-full text-neutral-900 shrink-0">
                <HelpCircle className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
                17. Need Help?
              </h2>
            </div>
            <p>
              If you have any questions about your order, shipping timelines, or this Policy, our team is happy to help.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-6 rounded-xl border border-neutral-200 text-xs sm:text-sm">
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Customer Support</p>
                <p className="font-semibold text-neutral-900">[Insert Contact Email]</p>
              </div>
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider mb-1">Support Hours</p>
                <p className="font-semibold text-neutral-900">[Insert Details]</p>
              </div>
            </div>
          </div>

          {/* CLOSING LEGAL NOTICE NESTED BOTTOM BANNER */}
          <div className="border-t border-neutral-200 pt-8 mt-12 bg-neutral-50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 md:-mx-14 md:-mb-14 p-6 sm:p-10 rounded-b-2xl text-center space-y-3">
            <div className="max-w-3xl mx-auto text-xs sm:text-sm text-neutral-600 italic leading-relaxed">
              This Shipping &amp; Delivery Policy is provided as a starting draft and should be reviewed by a qualified legal professional before publishing, to ensure it accurately reflects House of Urvaah&apos;s actual shipping operations, partner agreements, and compliance with applicable consumer protection and e-commerce regulations.
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default ShippingPolicy;
