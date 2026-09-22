import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export const ReturnRefundPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-20 md:pt-32 md:pb-28 overflow-x-hidden">
      {/* 1. HERO HEADER */}
      <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16 mb-8 md:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mb-3 block">
            CUSTOMER CARE &amp; POLICIES
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-wider uppercase text-[#111111] mb-5">
            Cancellation, Return &amp; Refund Policy
          </h1>
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-4 sm:mb-5" />
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
          {/* SECTION 1 */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              1. Overview
            </h2>
            <p>
              At House of Urvaah, we want you to love what you order. This policy explains how order cancellations, returns, exchanges and refunds work when you shop with us on our website and mobile application (the &quot;Platform&quot;). It should be read together with our Shipping &amp; Delivery Policy and Terms &amp; Conditions.
            </p>
            <p>
              By placing an order with House of Urvaah, you agree to the terms set out in this policy.
            </p>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-6 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              2. Order Cancellation
            </h2>

            {/* 2.1 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                2.1 Before Your Order is Shipped
              </h3>
              <p>
                You can cancel your order free of cost as long as it hasn&apos;t been packed or dispatched yet.
              </p>
              <ul className="space-y-2 pl-5 list-disc marker:text-neutral-400">
                <li>To cancel, go to &quot;My Orders&quot; on the Platform and select &quot;Cancel Order,&quot; or contact our support team with your order ID.</li>
                <li>Once cancelled, a full refund will be initiated to your original payment method (see Section 8 for refund timelines).</li>
              </ul>
            </div>

            {/* 2.2 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                2.2 After Your Order is Shipped
              </h3>
              <p>
                Once your order has been dispatched, it can no longer be cancelled. However, you may:
              </p>
              <ul className="space-y-2 pl-5 list-disc marker:text-neutral-400">
                <li>Refuse the delivery at your doorstep, or</li>
                <li>Accept the delivery and initiate a return once received, as per Section 4 below.</li>
              </ul>
            </div>

            {/* 2.3 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                2.3 Cancellation Time Limit
              </h3>
              <p>
                Cancellation requests are accepted only until your order moves to the &quot;Packed&quot; or &quot;Shipped&quot; stage. You can check your order&apos;s current status anytime under &quot;Track Order.&quot;
              </p>
              <p>
                Cut-off window for cancellation: [Insert Cancellation Time Limit]
              </p>
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              3. Order Amendments
            </h2>
            <p>
              If you&apos;d like to change the size, color, delivery address, or any other order detail after placing your order, please contact our support team as soon as possible. We&apos;ll try our best to accommodate changes before the order is packed, but we cannot guarantee this once processing has begun.
            </p>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-6 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              4. Returns
            </h2>

            {/* 4.1 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                4.1 Return Eligibility
              </h3>
              <p>
                We want you to be completely happy with your purchase. If you&apos;re not satisfied with an item, you may request a return within:
              </p>
              <p>
                [Insert Return Period, e.g. 7 / 10 / 14 days] from the date of delivery.
              </p>
              <p>
                To be eligible for a return, the item must be:
              </p>
              <ul className="space-y-2 pl-5 list-disc marker:text-neutral-400">
                <li>Unused, unworn, and unwashed;</li>
                <li>In its original condition with all tags, labels, and packaging intact;</li>
                <li>Free from stains, odours, alterations, or damage caused after delivery;</li>
                <li>Accompanied by the original invoice.</li>
              </ul>
            </div>

            {/* 4.2 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                4.2 How to Request a Return
              </h3>
              <ol className="space-y-2 pl-5 list-decimal marker:text-neutral-500">
                <li>Go to &quot;My Orders&quot; and select the item you&apos;d like to return.</li>
                <li>Choose your reason for return.</li>
                <li>Once approved, our delivery partner will arrange a pickup from your address, or you may be asked to self-ship the item, depending on your location.</li>
                <li>Your item will be inspected upon receipt before the return is finalized.</li>
              </ol>
              <p>
                Please note: returns requested outside the eligibility window mentioned above may not be accepted.
              </p>
            </div>

            {/* 4.3 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                4.3 Return Verification
              </h3>
              <p>
                All returned items go through a quality check upon receipt. If the returned product does not meet the conditions in Section 4.1 (e.g. it&apos;s worn, damaged, or tags are missing), we reserve the right to decline the return and send the item back to you instead of processing a refund or exchange.
              </p>
            </div>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              5. Exchanges
            </h2>
            <p>
              If you&apos;d like a different size or color of the same item, you can request an exchange instead of a return.
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Exchange requests must be raised within [Insert Exchange Period] of delivery, following the same process as returns.</li>
              <li>Exchanges are subject to stock availability. If the requested size/color is unavailable, we&apos;ll offer a refund or store credit instead.</li>
              <li>The item being exchanged must meet the same condition requirements listed in Section 4.1.</li>
              <li>[Insert Details — e.g. &quot;One exchange is allowed per item&quot; / &quot;Exchanges are available for size only, not style&quot;]</li>
            </ul>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              6. Damaged, Defective, or Incorrect Items
            </h2>
            <p>
              We&apos;re sorry if something went wrong with your order! If you receive a product that is damaged, defective, or different from what you ordered, please let us know within [Insert Reporting Window, e.g. 48 hours] of delivery, along with:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Clear photos/videos of the product and its packaging;</li>
              <li>Your order ID.</li>
            </ul>
            <p>
              Once verified, we will offer you a free replacement or a full refund, including any shipping charges paid, at no extra cost to you.
            </p>
            <p>
              If your package arrives with visibly damaged or tampered outer packaging, we recommend inspecting it in front of the delivery person and refusing delivery if the contents appear affected.
            </p>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              7. Items That Cannot Be Returned or Exchanged
            </h2>
            <p>
              For hygiene, safety, and quality reasons, the following items are not eligible for return or exchange, unless they arrive damaged, defective, or incorrect (as per Section 6):
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Innerwear, lingerie, and swimwear;</li>
              <li>Earrings and other pierced accessories;</li>
              <li>Items marked &quot;Final Sale&quot; or &quot;Non-Returnable&quot; on the product page;</li>
              <li>Products purchased using [Insert Details, e.g. gift cards / certain promotional codes], if specified at the time of purchase;</li>
              <li>Items where tags, labels, or original packaging have been removed or damaged;</li>
              <li>Products showing signs of use, wash, or alteration.</li>
            </ul>
          </div>

          {/* SECTION 8 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              8. Sale, Discounted &amp; Promotional Items
            </h2>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Items purchased during a sale or with a discount code are eligible for return/exchange under the same conditions as regular-priced items, unless specifically marked as &quot;Final Sale&quot; on the product page at the time of purchase.</li>
              <li>If a promotional discount or offer was applied to your order, the refunded amount will reflect the actual price paid, not the original listed price.</li>
              <li>[Insert Details if store credit or other special terms apply to sale items]</li>
            </ul>
          </div>

          {/* SECTION 9 */}
          <div className="space-y-6 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              9. Refunds
            </h2>

            {/* 9.1 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                9.1 Refund Eligibility
              </h3>
              <p>
                Refunds are issued once your returned item has been received and passed our quality check, or where a damaged/defective/incorrect item claim has been approved.
              </p>
            </div>

            {/* 9.2 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                9.2 Refund Method
              </h3>
              <p>
                Refunds are credited back to your original payment method (card, UPI, net banking, wallet, etc.). For orders paid via Cash on Delivery, the refund will be processed to [Insert Details — e.g. your provided bank account / UPI ID].
              </p>
              <p>
                [Insert Details if store credit or a wallet system is offered as an alternative refund option]
              </p>
            </div>

            {/* 9.3 */}
            <div className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-neutral-900">
                9.3 Refund Timeline
              </h3>
              <p>
                Once your return is approved:
              </p>
              <ul className="space-y-2 pl-5 list-disc marker:text-neutral-400">
                <li>Refunds are typically initiated within [Insert Refund Processing Time, e.g. 3–5 business days] of the item passing quality check.</li>
                <li>Depending on your bank or payment provider, it may take an additional [Insert Additional Bank Processing Time, e.g. 5–7 business days] for the amount to reflect in your account.</li>
              </ul>
              <p>
                You will receive an email/SMS confirmation once your refund has been initiated.
              </p>
            </div>
          </div>

          {/* SECTION 10 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              10. Shipping &amp; Return Charges
            </h2>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>
                <strong className="font-semibold text-neutral-900">Return pickup:</strong> [Insert Details — e.g. &quot;Free reverse pickup is available in most locations&quot; / &quot;A nominal return shipping fee of ₹__ may apply in certain areas&quot;].
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">Original shipping charges:</strong> [Insert Details — e.g. &quot;Non-refundable, except in cases of damaged, defective, or incorrect items&quot;].
              </li>
              <li>If self-shipping is required for your return (in areas where reverse pickup isn&apos;t available), please retain proof of shipment until your return is confirmed as received.</li>
            </ul>
          </div>

          {/* SECTION 11 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              11. Failed Deliveries &amp; Refused Orders
            </h2>
            <p>
              If an order could not be delivered due to an incorrect address, unavailability at the time of delivery, or refusal at the doorstep (for reasons other than visible damage), it will be returned to us.
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-neutral-400">
              <li>Once received back at our facility, a refund will be processed for the product amount. Original shipping charges may not be refunded in such cases.</li>
              <li>For orders paid via Cash on Delivery that are returned undelivered, no refund is applicable since no payment was collected; however, [Insert Details if any charges apply for failed COD attempts].</li>
            </ul>
          </div>

          {/* SECTION 12 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              12. Order Cancellation by House of Urvaah
            </h2>
            <p>
              In rare cases, we may need to cancel an order — for example, if an item is out of stock, there&apos;s a pricing error, or the delivery address is not serviceable. If this happens, we will notify you and issue a full refund for the affected item(s).
            </p>
          </div>

          {/* SECTION 13 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              13. Need Help?
            </h2>
            <p>
              We&apos;re here to make this as easy as possible. If you have any questions about a return, exchange, or refund, reach out to us:
            </p>
            <p>
              Email: [Insert Email Address] Phone: [Insert Phone Number] Support Hours: [Insert Support Hours]
            </p>
            <p>
              You can also track the status of your return or refund anytime under &quot;My Orders&quot; on the Platform.
            </p>
          </div>

          {/* SECTION 14 */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase">
              14. Changes to This Policy
            </h2>
            <p>
              House of Urvaah may update this policy from time to time to reflect changes in our processes or applicable regulations. The updated version will be posted on this page with a revised effective date.
            </p>
          </div>

          {/* CLOSING LEGAL NOTICE */}
          <div className="pt-6 border-t border-neutral-200">
            <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-600 rounded-sm italic leading-relaxed">
              This Cancellation, Return, Exchange &amp; Refund Policy is provided as a starting draft and should be reviewed by a qualified legal professional before publishing, to ensure it accurately reflects House of Urvaah&apos;s actual return process, timelines, and compliance with applicable consumer protection laws (including the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020, if operating in India).
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default ReturnRefundPolicy;
