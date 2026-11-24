import React from 'react';
import { motion } from 'framer-motion';
import { SEOHead } from '../components/common/SEOHead';

export const ShippingPolicy = () => {
  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-20 pb-16 md:pt-28 md:pb-24 overflow-x-hidden">
      <SEOHead
        title="Shipping Policy | House of Urvaah"
        description="Review House of Urvaah shipping and delivery details, including domestic express shipping, delivery timelines, and order tracking information."
        keywords="House of Urvaah shipping policy, express delivery, courier tracking, delivery charges"
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
            ORDERS &amp; FULFILMENT
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-normal tracking-[0.15em] uppercase text-[#111111] mb-2">
            SHIPPING &amp; DELIVERY POLICY
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-serif italic mb-4">
            Last updated: November 24, 2026
          </p>
          {/* SECTION */}
          <div className="w-12 h-[1px] bg-neutral-900/30" />
        </motion.div>
      </section>

      {/* 2. POLICY DOCUMENT CONTENT - SEAMLESS LUXURY EDITORIAL LAYOUT */}
      <section className="w-full max-w-[1000px] mx-auto px-6 sm:px-10 lg:px-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10 sm:space-y-12 text-neutral-700 leading-relaxed font-light text-sm sm:text-base font-serif"
        >
          {/* INTRODUCTORY STATEMENT */}
          <div className="pb-8 border-b border-neutral-200">
            <p className="text-neutral-700 leading-relaxed">
              This policy explains how House Of Urvaah ships and delivers your orders.
            </p>
          </div>

          {/* SECTION 1 */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              1. Where We Ship
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                We ship across India to all serviceable pin codes. Enter your pin code at checkout to confirm delivery is available. [We currently do not ship internationally]
            </p>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              2. Order Processing Time
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                Orders are processed and dispatched within [2–7] business days of payment/confirmation (business days exclude Sundays and public holidays). Made-to-order or customised items may take [7–15] business days to prepare; this will be mentioned on the product page. During sales, festivals and peak seasons, processing may take a little longer.
            </p>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              3. Delivery Timelines
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                These are estimates, not guarantees. Delays can happen due to weather, strikes, natural events, courier issues or incorrect addresses, and are beyond our control.
            </p>
            <div className="overflow-x-auto my-6 border border-neutral-200 rounded-lg bg-white">
                <table className="w-full text-left text-xs sm:text-sm font-serif border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-900">
                      <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-[60%] sm:w-[65%]">
                        Location
                      </th>
                      <th className="py-3.5 px-4 sm:px-6 font-semibold tracking-wider uppercase text-[11px] sm:text-xs w-[40%] sm:w-[35%]">
                        Estimated Delivery After Dispatch
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
                        [3–7] business days
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6 align-top font-semibold text-neutral-900">
                        Rest of India
                      </td>
                      <td className="py-4 px-4 sm:px-6 align-top font-medium text-neutral-900 whitespace-nowrap">
                        [5–10] business days
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6 align-top font-semibold text-neutral-900">
                        Remote / difficult areas
                      </td>
                      <td className="py-4 px-4 sm:px-6 align-top font-medium text-neutral-900 whitespace-nowrap">
                        [8–14] business days
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              4. Shipping Charges
            </h2>
            <ul className="space-y-2 pl-5 list-disc marker:text-neutral-400 text-neutral-700 leading-relaxed">
                <li>Free shipping on orders above ₹[3000] within India.</li>
                <li>A flat shipping fee of ₹[200] applies to orders below that value.</li>
                <li>Cash on Delivery is not available at this moment.</li>
                <li>Any applicable shipping charges are shown at checkout before you pay.</li>
              </ul>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              5. Order Tracking
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                Once your order is dispatched, we will email and/or message you the courier name and tracking link. Tracking may take up to 24–48 hours to update on the courier&apos;s system.
            </p>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              6. Delivery Attempts and Address Issues
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                Please provide a complete and correct address and a working phone number. We are not responsible for delays or non-delivery caused by incorrect or incomplete details.
            </p>
            <p className="text-neutral-700 leading-relaxed">
                The courier will usually attempt delivery up to 2 times. If delivery fails, the parcel may be returned to us. In that case, we will contact you to arrange re-shipping at your cost, or cancel the order and refund the amount after deducting shipping and handling charges.
            </p>
            <p className="text-neutral-700 leading-relaxed">
                To change your address, contact us at{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
                >
                  houseofurvaah@yahoo.com
                </a>{' '}
                as soon as possible before the order is dispatched.
            </p>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              7. Damaged, Tampered or Wrong Items
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                Please check the package at the time of delivery. If it appears damaged or tampered with, do not accept it, or record an unboxing video and write to us within 48 hours at{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
                >
                  houseofurvaah@yahoo.com
                </a>{' '}
                with your order number, photos and the video. We will arrange a replacement or refund as per our Returns and Refund Policy.
            </p>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              8. Cancellations Before Dispatch
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                You can cancel an order before it is dispatched by contacting us at{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
                >
                  houseofurvaah@yahoo.com
                </a>
                . Once shipped, it cannot be cancelled, but you may be eligible to return it as per our return policy.
            </p>
          </div>

          {/* SECTION */}
          <div className="space-y-4 pt-8 border-t border-neutral-200">
            <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              9. Contact
            </h2>
            <p className="text-neutral-700 leading-relaxed">
                For shipping questions, email{' '}
                <a
                  href="mailto:houseofurvaah@yahoo.com"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
                >
                  houseofurvaah@yahoo.com
                </a>{' '}
                or call/WhatsApp{' '}
                <a
                  href="https://wa.me/919833325657"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-normal underline underline-offset-4 hover:text-neutral-900 transition-colors"
                >
                  9833325657
                </a>
                .
            </p>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default ShippingPolicy;
