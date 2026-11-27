import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';

export const ShippingPolicy = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-20 pb-16 md:pt-28 md:pb-24 overflow-x-hidden">
      <SEOHead
        title="Shipping & Delivery Policy | House of Urvaah"
        description="Review House of Urvaah shipping and delivery details, including domestic express shipping, delivery timelines, tracking, and policies."
        keywords="House of Urvaah shipping policy, express delivery, courier tracking, delivery charges, shipping timelines"
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
            ORDERS &amp; FULFILMENT
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-normal tracking-[0.15em] uppercase text-[#111111] mb-2">
            SHIPPING &amp; DELIVERY POLICY
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
          {/* 1. INTRODUCTION & SCOPE */}
          <div className="space-y-4 pb-6 sm:pb-8 border-b border-neutral-200 text-left sm:text-justify [text-justify:inter-word]">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              1. Introduction &amp; Scope
            </h2>
            <p>
              House of Urvaah (&quot;House of Urvaah&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an online fashion retailer offering women&apos;s clothing, apparel and accessories (&quot;Products&quot;) through our website and mobile application (the &quot;Platform&quot;). This Shipping &amp; Delivery Policy (&quot;Policy&quot;) explains how orders placed on the Platform are processed, packed, dispatched and delivered to you (the &quot;Customer&quot;, &quot;User&quot; or &quot;you&quot;).
            </p>
            <p>
              This Policy forms part of our{' '}
              <Link to="/terms-and-conditions" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Terms &amp; Conditions
              </Link>{' '}
              and should be read together with our{' '}
              <Link to="/cancellation-return-refund-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Cancellation, Return, Exchange &amp; Refund Policy
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Privacy Policy
              </Link>
              . By placing an order on the Platform, you agree to the terms of this Policy.
            </p>
            <p>
              Orders are dispatched from our fulfillment center(s) and delivered by our independent third-party logistics and courier partners (&quot;Delivery Partners&quot;). Delivery Partners are independent service providers responsible for the physical transport and handover of your order.
            </p>
            <p>
              This Policy may be updated from time to time to reflect changes in our operations or our Delivery Partners&apos; capabilities. The version in effect at the time you place your order will apply to that order.
            </p>
          </div>

          {/* 2. SERVICEABLE AREAS */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              2. Serviceable Areas
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We currently ship across India to all serviceable pin codes. At checkout, simply enter your delivery pin code and the Platform will confirm whether we currently deliver to your area, along with the applicable delivery estimate and shipping charges.
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Delivery availability, timelines and charges may vary depending on your location.</li>
              <li>Some remote or restricted-access locations may have longer delivery windows or may not be serviceable at this time.</li>
              <li>We may, from time to time, add or remove serviceable areas without prior notice, based on operational or logistics requirements.</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed pt-1 text-left sm:text-justify [text-justify:inter-word]">
              <strong className="font-semibold text-neutral-900">International shipping:</strong> We currently do not ship internationally.
            </p>
          </div>

          {/* 3. ORDER PROCESSING TIME */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              3. Order Processing Time
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Once your order is placed and payment is confirmed, it goes through a quick quality check before being packed and handed over to our Delivery Partner.
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Orders are typically processed and dispatched within 2–7 business days of payment/order confirmation (business days exclude Sundays and public holidays).</li>
              <li>Made-to-order or customized items may take 7–15 business days to prepare; this will be mentioned on the product page.</li>
              <li>Orders placed after [Insert Details, e.g. cut-off time] or on weekends/public holidays will begin processing on the next business day.</li>
              <li>During sale periods, festive seasons or new-collection launches, processing times may take slightly longer than usual due to higher order volumes. We appreciate your patience during these times.</li>
              <li>You will receive an order confirmation email/SMS once your order is placed, and a dispatch confirmation with tracking details once it leaves our facility.</li>
            </ul>
          </div>

          {/* 4. SHIPPING TIMELINES */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              4. Shipping Timelines
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Once dispatched, estimated delivery timelines depend on your location:
            </p>
            <div className="overflow-x-auto my-4 border border-neutral-200 rounded-lg bg-white">
              <table className="w-full text-left text-xs sm:text-sm font-serif border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-900">
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-[60%] sm:w-[65%]">
                      Delivery Zone
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-[40%] sm:w-[35%]">
                      Estimated Delivery Time (from dispatch)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  <tr className="hover:bg-neutral-50/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6 align-top">
                      <span className="font-semibold text-neutral-900 block">
                        Metro cities
                      </span>
                      <span className="text-xs text-neutral-500 block mt-0.5">
                        (Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, Pune)
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 align-top font-medium text-neutral-900 whitespace-nowrap">
                      3–7 business days
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6 align-top font-semibold text-neutral-900">
                      Rest of India
                    </td>
                    <td className="py-4 px-4 sm:px-6 align-top font-medium text-neutral-900 whitespace-nowrap">
                      5–10 business days
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6 align-top font-semibold text-neutral-900">
                      Remote / difficult areas
                    </td>
                    <td className="py-4 px-4 sm:px-6 align-top font-medium text-neutral-900 whitespace-nowrap">
                      8–14 business days
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              These timelines are estimates only and are not guaranteed delivery dates. Actual delivery may be affected by your exact location, weather conditions, regional holidays, strikes, natural events, courier network delays, incorrect address details, or circumstances beyond our control (see Section 10 — Delays &amp; Force Majeure).
            </p>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              The estimated delivery window shown at checkout is based on the information available at the time of order and excludes the order processing time described in Section 3.
            </p>
          </div>

          {/* 5. SHIPPING CHARGES */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              5. Shipping Charges
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Shipping charges, if applicable, are calculated based on your delivery location and the value of your order, and will always be clearly displayed at checkout before you complete your purchase — there are no hidden shipping costs.
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>
                <strong className="font-semibold text-neutral-900">Free shipping:</strong> Enjoy free shipping on all orders above ₹3,000 within India.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Orders below the free-shipping threshold:</strong> A flat shipping fee of ₹200 applies to orders below ₹3,000.
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Cash on Delivery:</strong> Currently not available.
              </li>
              <li>Any promotional or discounted shipping offers will be clearly communicated at checkout and are subject to the specific terms of that offer.</li>
              <li>
                Shipping charges (where applicable) are non-refundable except in cases where the return or non-delivery is due to an error on our part, as detailed in our{' '}
                <Link to="/cancellation-return-refund-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                  Cancellation, Return, Exchange &amp; Refund Policy
                </Link>
                .
              </li>
            </ul>
          </div>

          {/* 6. ORDER TRACKING */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              6. Order Tracking
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Once your order is dispatched, you will receive the courier name and a tracking link via email and/or SMS. You can also track your order at any time by:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Visiting the &quot;Track Order&quot; section on the Platform, or</li>
              <li>Logging into your House of Urvaah account and viewing your order history.</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed pt-1 text-left sm:text-justify [text-justify:inter-word]">
              Please allow up to 24–48 hours after dispatch for tracking information to update on the courier&apos;s system.
            </p>
          </div>

          {/* 7. DELIVERY PROCESS */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              7. Delivery Process
            </h2>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Our Delivery Partner will make reasonable attempts (usually up to 2 attempts) to deliver your order to the address provided at checkout.</li>
              <li>Someone should be available at the delivery address during the estimated delivery window to receive the package.</li>
              <li>For certain orders, the Delivery Partner may request an OTP, signature or other confirmation to verify successful delivery. Please keep any delivery OTP confidential and share it only with the delivery agent at the time of delivery.</li>
              <li>You may authorize another adult at your delivery address to receive the order on your behalf; delivery to and acceptance by such a person will be considered valid delivery.</li>
              <li>Once delivery is confirmed (via signature, OTP or courier confirmation), the order is considered successfully delivered.</li>
            </ul>
          </div>

          {/* 8. INCORRECT OR INCOMPLETE ADDRESS */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              8. Incorrect or Incomplete Address
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Please provide a complete and correct shipping address, pin code and a working contact number before confirming your order, as this helps us ensure a smooth delivery experience. We are not responsible for delays or non-delivery caused by incorrect or incomplete details provided by you.
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>If an order cannot be delivered due to an incorrect, incomplete or unreachable address provided by you, it may be returned to our fulfillment center.</li>
              <li>In such cases, we will contact you to arrange re-shipment. Additional shipping charges may apply for re-shipping orders returned due to incorrect address details provided at checkout.</li>
              <li>
                If you need to update your delivery address after placing an order, please contact our support team as soon as possible at{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  houseofurvaah@yahoo.com
                </a>{' '}
                — we&apos;ll try our best to accommodate the change if the order hasn&apos;t already been dispatched, though we cannot guarantee this.
              </li>
            </ul>
          </div>

          {/* 9. FAILED DELIVERY ATTEMPTS & RETURN TO ORIGIN */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              9. Failed Delivery Attempts &amp; Return to Origin
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              If our Delivery Partner is unable to deliver your order after reasonable attempts — for example, if you are unavailable, the address is inaccessible, or delivery is declined — the order may be sent back to our fulfillment center (&quot;Return to Origin&quot;).
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>We will notify you if this happens and either arrange re-shipping at your cost, or cancel the order and refund the amount after deducting shipping and handling charges.</li>
              <li>
                Refunds (where applicable) for orders returned due to failed delivery are handled in accordance with our{' '}
                <Link to="/cancellation-return-refund-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                  Cancellation, Return, Exchange &amp; Refund Policy
                </Link>
                . Please note that original shipping charges may not be refundable where the failed delivery was not due to an error on our part.
              </li>
            </ul>
          </div>

          {/* 10. DELAYS & FORCE MAJEURE */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              10. Delays &amp; Force Majeure
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              While we work closely with our Delivery Partners to ensure timely delivery, delays can occasionally occur due to circumstances beyond our reasonable control, including but not limited to:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>Severe weather conditions or natural events;</li>
              <li>Regional strikes, transport disruptions or public holidays;</li>
              <li>Courier network congestion during high-demand periods (e.g. sale events, festive seasons);</li>
              <li>Government restrictions or regulatory action; or</li>
              <li>Other events beyond our reasonable control.</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed pt-1 text-left sm:text-justify [text-justify:inter-word]">
              In such circumstances, House of Urvaah and its Delivery Partners will not be held liable for delays, but we will make reasonable efforts to keep you informed and to complete delivery as soon as reasonably possible.
            </p>
          </div>

          {/* 11. RECEIVING YOUR ORDER — DAMAGED OR TAMPERED PACKAGES */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              11. Receiving Your Order — Damaged or Tampered Packages
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We take great care in packaging your order to ensure it reaches you in perfect condition. However, in the rare event that your package arrives visibly damaged or tampered with:
            </p>
            <ul className="space-y-2.5 pl-5 sm:pl-6 list-disc marker:text-neutral-400 text-left sm:text-justify [text-justify:inter-word]">
              <li>We recommend inspecting the outer packaging at the time of delivery, and if it appears significantly damaged or tampered with, you may choose to refuse the delivery.</li>
              <li>
                If you&apos;ve already accepted the package and later notice damage, please record an unboxing video and take clear photographs of the packaging and the product, and reach out to us within 48 hours of delivery at{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  houseofurvaah@yahoo.com
                </a>{' '}
                with your order number, photos and the video.
              </li>
              <li>
                Eligible damaged, defective or incorrect-item claims will be addressed through our{' '}
                <Link to="/cancellation-return-refund-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                  Cancellation, Return, Exchange &amp; Refund Policy
                </Link>
                , which outlines the process for replacement, exchange or refund.
              </li>
            </ul>
          </div>

          {/* 12. ORDER CANCELLATIONS BEFORE DISPATCH */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              12. Order Cancellations Before Dispatch
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              If you wish to cancel your order before it has been dispatched, please contact us at{' '}
              <a
                href="mailto:houseofurvaah@yahoo.com"
                className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
              >
                houseofurvaah@yahoo.com
              </a>{' '}
              or refer to our{' '}
              <Link to="/cancellation-return-refund-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Cancellation, Return, Exchange &amp; Refund Policy
              </Link>{' '}
              for the applicable process and timelines. Once an order has been dispatched, it cannot be cancelled, but you may be eligible for a return in accordance with that policy.
            </p>
          </div>

          {/* 13. MULTIPLE ITEMS & SPLIT SHIPMENTS */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              13. Multiple Items &amp; Split Shipments
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              If your order contains multiple items, they may occasionally be shipped separately (in more than one package) depending on stock location and availability, at no extra cost to you. You will be notified separately for each shipment with its own tracking details.
            </p>
          </div>

          {/* 14. RESTRICTED SHIPPING */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              14. Restricted Shipping
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We reserve the right to decline or cancel an order if the delivery location is not serviceable, if the order appears fraudulent, or if shipping the order would violate applicable law or our Delivery Partners&apos; policies. In such cases, you will be notified and any amount paid will be refunded in accordance with our{' '}
              <Link to="/cancellation-return-refund-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Cancellation, Return, Exchange &amp; Refund Policy
              </Link>
              .
            </p>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              Orders placed on the Platform are intended for personal use only and not for resale or commercial redistribution.
            </p>
          </div>

          {/* 15. YOUR INFORMATION & PRIVACY */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              15. Your Information &amp; Privacy
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              To fulfill and deliver your order, we share the minimum necessary information (such as your name, delivery address, phone number and order details) with our Delivery Partners, strictly for the purpose of delivery, verification, and coordination. This is handled in accordance with our{' '}
              <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-neutral-900 transition-colors font-normal">
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              By placing an order, you consent to receiving delivery-related communications (SMS, email, in-app notifications and/or calls) necessary to coordinate and complete your delivery.
            </p>
          </div>

          {/* 16. CHANGES TO THIS POLICY */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              16. Changes to This Policy
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              We may update this Shipping &amp; Delivery Policy from time to time to reflect changes in our shipping processes, partners, or applicable regulations. The updated policy will be posted on this page with a revised effective date. We encourage you to review this page periodically.
            </p>
          </div>

          {/* 17. NEED HELP? */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase text-left">
              17. Need Help?
            </h2>
            <p className="text-neutral-700 leading-relaxed text-left sm:text-justify [text-justify:inter-word]">
              If you have any questions about your order, shipping timelines, or this Policy, our team is happy to help:
            </p>
            <div className="space-y-2 text-neutral-700 leading-relaxed text-left">
              <p>
                <span className="font-semibold text-neutral-900">Customer Support:</span>{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  houseofurvaah@yahoo.com
                </a>
              </p>
              <p>
                <span className="font-semibold text-neutral-900">Phone / WhatsApp:</span>{' '}
                <a
                  href="https://wa.me/919833325657"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors break-all sm:break-normal"
                >
                  +91 9833325657
                </a>
              </p>
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default ShippingPolicy;
