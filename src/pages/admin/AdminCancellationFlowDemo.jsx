import React, { useState, useEffect } from 'react';
import {
  XCircle,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  RefreshCw,
  Zap,
  Play,
  RotateCw,
  FileText,
  Mail,
  Send,
  Building,
  Check
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export const AdminCancellationFlowDemo = () => {
  // Scenario Mode: 'pre_dispatch' (Standard) vs 'mid_transit_rto' (Post-Dispatch)
  const [cancellationMode, setCancellationMode] = useState('pre_dispatch');
  
  // Current active step in the flow (0 = Not started, 1 to 5 = In progress, 5 = Complete)
  const [activeStep, setActiveStep] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);

  // Selected order for demo simulation
  const [demoOrder, setDemoOrder] = useState({
    orderNumber: 'HOU-598047',
    customerName: 'Vishal Rajput',
    item: 'Mocha Brown Embroidered Co-ord Set (Qty: 2)',
    amount: 17980,
    paymentMethod: 'Prepaid (Card / UPI)',
    reason: 'Incorrect size ordered by mistake',
    status: 'Confirmed'
  });

  // Steps definition based on active scenario mode
  const steps = cancellationMode === 'pre_dispatch' ? [
    {
      stepNum: 1,
      title: 'Customer Submits Cancellation',
      desc: 'Customer clicks "Cancel Order" on Account page within the 12-hour window and selects a reason.',
      customerView: 'Order status changes from Confirmed to "Cancellation Requested".',
      backendAction: 'Urvaah Backend verifies that the parcel has not yet been collected by the courier.',
      apiEndpoint: 'POST /api/orders/cancel'
    },
    {
      stepNum: 2,
      title: 'Shiprocket Pickup Voided',
      desc: 'Urvaah backend contacts Shiprocket API to immediately void the courier pickup request.',
      customerView: 'Cancellation confirmed instantly on screen.',
      backendAction: 'Shiprocket voids AWB. Courier driver is notified NOT to visit Urvaah Atelier. Zero freight fees incurred.',
      apiEndpoint: 'POST /v1/external/orders/cancel'
    },
    {
      stepNum: 3,
      title: 'Inventory Automatically Restored',
      desc: 'Catalog stock quantities for both garments are immediately auto-incremented back into inventory.',
      customerView: 'Items become available again for other shoppers on the website.',
      backendAction: 'PostgreSQL inventory automation runs: UPDATE products SET stock = stock + quantity.',
      apiEndpoint: 'DB Automation (URVAAH-014)'
    },
    {
      stepNum: 4,
      title: '100% Financial Refund Initiated',
      desc: 'Full order amount of ₹17,980 is automatically credited back to original payment method.',
      customerView: 'Refund reference generated (UTR: 9812739182). Funds arrive in 2-4 business days.',
      backendAction: 'Razorpay / Gateway refund API triggered. Official refund receipt attached to order record.',
      apiEndpoint: 'POST /api/admin/refunds/initiate'
    },
    {
      stepNum: 5,
      title: 'Confirmation Alerts Dispatched',
      desc: 'Customer receives instant WhatsApp and email notifications confirming cancellation & refund.',
      customerView: 'WhatsApp alert: "Order #HOU-598047 cancelled. Full refund of ₹17,980 initiated."',
      backendAction: 'Brevo Email Service and WhatsApp notification engines send official cancellation invoice.',
      apiEndpoint: 'Brevo & WhatsApp Notification Service'
    }
  ] : [
    {
      stepNum: 1,
      title: 'Cancellation While In Transit',
      desc: 'Customer requests cancellation after the parcel has already been picked up and is in transit.',
      customerView: 'Order status updates to "Cancellation Requested (In Transit)".',
      backendAction: 'Courier partner is flagged that customer requested cancellation mid-journey.',
      apiEndpoint: 'POST /api/orders/cancel'
    },
    {
      stepNum: 2,
      title: 'Shiprocket RTO (Return to Origin) Triggered',
      desc: 'Shiprocket signals the destination hub to halt delivery and initiate Return-to-Origin (RTO).',
      customerView: 'Tracking scan changes to: "RTO Initiated - Returning to Sender".',
      backendAction: 'Courier rider is instructed not to attempt delivery. Parcel is routed back to Mumbai Atelier.',
      apiEndpoint: 'Shiprocket Webhook: EVENT_RTO_INITIATED'
    },
    {
      stepNum: 3,
      title: 'Package Received at Homved Atelier',
      desc: 'The physical parcel arrives back at House of Urvaah atelier facility.',
      customerView: 'Tracking updates to: "Package Received at Atelier Facility".',
      backendAction: 'Atelier QA team inspects box seals and updates status to "Received at Homved".',
      apiEndpoint: 'PATCH /api/orders/:id/status (Received at Homved)'
    },
    {
      stepNum: 4,
      title: 'Stock Restocking at Homved (URVAAH-014)',
      desc: 'Condition is verified as unworn and undamaged. Garments are returned to active boutique inventory.',
      customerView: 'Items restocked in atelier collection.',
      backendAction: 'Automated inventory script restores product stock only after physical arrival at Homved.',
      apiEndpoint: 'DB Automation (URVAAH-014 Restock)'
    },
    {
      stepNum: 5,
      title: 'Refund Settled to Customer (URVAAH-RR-07)',
      desc: 'Financial refund is released to the customer after successful receipt verification.',
      customerView: 'Full refund settled to customer account. Notification sent via email.',
      backendAction: 'Automated refund receipt generated and financial payout processed.',
      apiEndpoint: 'POST /api/admin/refunds/initiate'
    }
  ];

  // Auto-play flow runner
  const handleAutoPlay = () => {
    setActiveStep(1);
    setIsPlayingAuto(true);
  };

  useEffect(() => {
    let timer;
    if (isPlayingAuto && activeStep < 5) {
      timer = setTimeout(() => {
        setActiveStep(prev => prev + 1);
      }, 1500);
    } else if (activeStep >= 5) {
      setIsPlayingAuto(false);
    }
    return () => clearTimeout(timer);
  }, [isPlayingAuto, activeStep]);

  const handleReset = () => {
    setActiveStep(0);
    setIsPlayingAuto(false);
  };

  return (
    <div className="space-y-6 font-admin p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <AdminPageHeader
        title="Cancellation Flow Interactive Demo"
        subtitle="Visual, Step-by-Step Breakdown of How Pre-Dispatch and Post-Dispatch Cancellations Work Across Customer, Storefront, and Shiprocket."
      />

      {/* 2. Scenario Mode Switcher */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-admin">
            Select Cancellation Scenario:
          </span>
          <div className="inline-flex p-1 bg-neutral-100 rounded-xl border border-neutral-200/60">
            <button
              type="button"
              onClick={() => {
                setCancellationMode('pre_dispatch');
                handleReset();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cancellationMode === 'pre_dispatch'
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Case A: Pre-Dispatch (Normal)
            </button>
            <button
              type="button"
              onClick={() => {
                setCancellationMode('mid_transit_rto');
                handleReset();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cancellationMode === 'mid_transit_rto'
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Case B: Mid-Transit (RTO Reversal)
            </button>
          </div>
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={isPlayingAuto}
            onClick={handleAutoPlay}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Auto-Play Flow</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3. Visual 5-Step Glowing Progress Stepper */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-admin">
              {cancellationMode === 'pre_dispatch' 
                ? 'Pre-Dispatch Cancellation Pipeline (Instant Void)' 
                : 'Mid-Transit Return-to-Origin Pipeline (RTO Flow)'}
            </h3>
            <p className="text-[11px] text-neutral-500">
              Click any step below or press Auto-Play to see how the system processes each action.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-neutral-100 text-neutral-800 px-3 py-1 rounded-full">
            {activeStep === 0 ? 'READY TO START' : activeStep === 5 ? 'COMPLETED (100%)' : `STEP ${activeStep} OF 5`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {steps.map((st, idx) => {
            const isCompleted = activeStep > st.stepNum;
            const isCurrent = activeStep === st.stepNum;

            return (
              <button
                type="button"
                key={st.stepNum}
                onClick={() => setActiveStep(st.stepNum)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isCurrent
                    ? 'bg-neutral-900 text-white border-black ring-2 ring-neutral-400 shadow-md'
                    : isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-neutral-50/70 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold ${
                    isCurrent ? 'text-amber-300' : isCompleted ? 'text-emerald-700' : 'text-neutral-400'
                  }`}>
                    STEP 0{st.stepNum}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Zap className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
                  ) : null}
                </div>
                <h4 className="text-xs font-bold leading-snug line-clamp-2">{st.title}</h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Split-Screen Simulation Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What the Customer Experiences */}
        <div className="lg:col-span-5 bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-dark" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-admin">
                Customer View (Account Page)
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md font-semibold">
              Live Mockup
            </span>
          </div>

          {/* Simulated Customer Order Card */}
          <div className="border border-neutral-200 rounded-xl p-4 bg-[#FAF8F3] space-y-3 font-sans">
            <div className="flex items-center justify-between text-xs border-b border-[#E7E2D8] pb-2">
              <div>
                <span className="text-[10px] uppercase font-serif text-neutral-400 block tracking-wider">ORDER REFERENCE</span>
                <span className="font-bold text-neutral-900 font-mono">#{demoOrder.orderNumber}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                activeStep >= 2
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : activeStep === 1
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {activeStep >= 2 ? 'CANCELLED' : activeStep === 1 ? 'CANCELLATION REQUESTED' : 'CONFIRMED'}
              </span>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-semibold text-neutral-900">{demoOrder.item}</p>
              <p className="text-[11px] text-neutral-500">Total: ₹{demoOrder.amount.toLocaleString('en-IN')} • {demoOrder.paymentMethod}</p>
            </div>

            {/* Stepper Inside Customer Card */}
            <div className="pt-2 border-t border-[#E7E2D8]">
              <span className="text-[10px] font-serif text-neutral-400 uppercase tracking-wider block mb-2">ORDER JOURNEY STATUS</span>
              <div className="flex items-center justify-between text-[10px] font-semibold text-center">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center mx-auto">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Placed</span>
                </div>
                <div className="h-0.5 flex-1 bg-neutral-300 mx-1" />
                <div className="space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                    activeStep >= 2 ? 'bg-rose-600 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {activeStep >= 2 ? <XCircle className="w-3.5 h-3.5" /> : '2'}
                  </div>
                  <span>{activeStep >= 2 ? 'Cancelled' : 'Shipped'}</span>
                </div>
                <div className="h-0.5 flex-1 bg-neutral-300 mx-1" />
                <div className="space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                    activeStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {activeStep >= 4 ? <Check className="w-3 h-3" /> : '3'}
                  </div>
                  <span>{activeStep >= 4 ? 'Refunded' : 'Delivered'}</span>
                </div>
              </div>
            </div>

            {/* Refund Receipt Preview */}
            {activeStep >= 4 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>100% Refund Issued: ₹{demoOrder.amount.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  Transaction Reference: <code className="font-mono font-bold">UTR-9812739182</code>
                </p>
                <p className="text-[10px] text-emerald-700">Credit will reflect in your account within 2-4 business days.</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-500 italic">
            💡 Notice how the customer is shielded from backend complexity. They immediately receive peace of mind that their order is cancelled and their funds are secured.
          </p>
        </div>

        {/* Right Column: Behind-The-Scenes Logistics Engine (Shiprocket + DB) */}
        <div className="lg:col-span-7 bg-neutral-900 text-white border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-admin">
                Backend & Shiprocket Engine (Behind the Scenes)
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md font-semibold">
              Live System State
            </span>
          </div>

          {activeStep === 0 ? (
            <div className="p-8 text-center text-neutral-400 space-y-3">
              <Truck className="w-8 h-8 mx-auto text-neutral-600" />
              <h4 className="text-sm font-bold text-neutral-200">Simulation Ready</h4>
              <p className="text-xs max-w-sm mx-auto">
                Select a step above or click <strong>"Auto-Play Flow"</strong> to see how Shiprocket APIs, database inventory, and payment gateways interact during cancellation.
              </p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Active Step Card */}
              <div className="bg-neutral-800/90 border border-neutral-700 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-neutral-700 pb-2">
                  <span className="font-bold text-amber-300 uppercase tracking-wider font-mono text-[11px]">
                    ACTIVE STEP {activeStep}: {steps[activeStep - 1]?.title}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Endpoint: <code className="text-emerald-400">{steps[activeStep - 1]?.apiEndpoint}</code>
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {steps[activeStep - 1]?.backendAction}
                </p>

                {/* Technical Payload / Execution Preview */}
                <div className="bg-black/80 rounded-lg p-3 font-mono text-[11px] text-neutral-300 space-y-1.5 border border-neutral-800">
                  {activeStep === 1 && (
                    <>
                      <span className="text-neutral-500 block">// Inbound Request from Storefront</span>
                      <p className="text-emerald-400">POST /api/orders/cancel</p>
                      <p className="text-neutral-400">{`{ "order_id": "${demoOrder.orderNumber}", "reason": "${demoOrder.reason}" }`}</p>
                    </>
                  )}

                  {activeStep === 2 && (
                    <>
                      <span className="text-neutral-500 block">// Shiprocket Carrier Cancellation API</span>
                      <p className="text-amber-400">POST https://apiv2.shiprocket.in/v1/external/orders/cancel</p>
                      <p className="text-neutral-400">{`{ "ids": [${cancellationMode === 'pre_dispatch' ? '9812734' : '9928174'}] }`}</p>
                      <p className="text-emerald-400">↳ Response: {`{ "status": 200, "message": "Shipment voided. Courier pickup cancelled." }`}</p>
                    </>
                  )}

                  {activeStep === 3 && (
                    <>
                      <span className="text-neutral-500 block">// Database Stock Restoration (URVAAH-014)</span>
                      <p className="text-blue-400">UPDATE order_items SET status = 'Cancelled' WHERE order_id = $1;</p>
                      <p className="text-blue-400">UPDATE products SET stock_quantity = stock_quantity + 2 WHERE id = 101;</p>
                      <p className="text-emerald-400">↳ 2 units restored to House of Urvaah catalog.</p>
                    </>
                  )}

                  {activeStep === 4 && (
                    <>
                      <span className="text-neutral-500 block">// Payment Gateway Financial Refund (URVAAH-RR-07)</span>
                      <p className="text-purple-400">POST https://api.razorpay.com/v1/payments/pay_mock_10293/refund</p>
                      <p className="text-neutral-400">{`{ "amount": 1798000, "notes": { "reason": "Pre-dispatch cancellation" } }`}</p>
                      <p className="text-emerald-400">↳ Response: {`{ "id": "rfnd_992182", "status": "processed", "utr": "UTR-9812739182" }`}</p>
                    </>
                  )}

                  {activeStep === 5 && (
                    <>
                      <span className="text-neutral-500 block">// Multi-Channel Post-Purchase Notification</span>
                      <p className="text-emerald-400">WhatsApp Notification: Dispatched via Template URVAAH_ORDER_CANCELLED</p>
                      <p className="text-emerald-400">Brevo Email: Cancellation PDF Tax Credit Note sent to {demoOrder.customerName}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Navigation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={activeStep <= 1}
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs text-neutral-300 disabled:opacity-30 cursor-pointer"
                >
                  ← Previous Step
                </button>

                <button
                  type="button"
                  disabled={activeStep >= 5}
                  onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
                  className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCancellationFlowDemo;
