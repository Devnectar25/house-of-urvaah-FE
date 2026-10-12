import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, MapPin, AlertCircle, XCircle, Check } from 'lucide-react';

export const DeliveryReminderWidget = ({
  pincode,
  setPincode,
  handleCheckPincode,
  checkingPincode,
  pincodeResult,
  setPincodeResult,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 53, seconds: 52 });
  const [deliveryDates, setDeliveryDates] = useState({ start: '14 Oct', end: '16 Oct' });

  useEffect(() => {
    // 1. Calculate dynamic 3-5 day delivery date range
    const now = new Date();
    const dStart = new Date(now);
    dStart.setDate(now.getDate() + 3);
    const dEnd = new Date(now);
    dEnd.setDate(now.getDate() + 5);

    const formatShortDate = (d) => {
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      return `${day} ${month}`;
    };

    setDeliveryDates({
      start: formatShortDate(dStart),
      end: formatShortDate(dEnd),
    });

    // 2. Live Countdown Timer until daily dispatch cutoff (end of day)
    const updateCountdown = () => {
      const current = new Date();
      const endOfDay = new Date(current);
      endOfDay.setHours(23, 59, 59, 999);

      const diff = Math.max(0, endOfDay.getTime() - current.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#FAF8F5] border border-neutral-200 p-4 sm:p-5 font-sans text-brand-dark mb-4 space-y-3 shadow-2xs">
      {/* =========================================================================
          TEMPORARILY HIDDEN SECTION (As requested):
          3-5 Day Delivery PAN India Countdown & 3-Step Icons Grid.
          Uncomment this block whenever you wish to re-enable it in the future.
          ========================================================================= */}
      {/*
      <h3 className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-brand-dark font-sans text-left">
        3-5 Day Delivery PAN India
      </h3>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black text-white flex items-center justify-center shadow-2xs shrink-0">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-2">
            Order in
          </span>
          <span className="text-xs sm:text-sm font-bold text-red-600 tabular-nums mt-0.5 whitespace-nowrap">
            {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black text-white flex items-center justify-center shadow-2xs shrink-0">
            <Truck className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-2">
            Ships
          </span>
          <span className="text-xs sm:text-sm font-semibold text-neutral-800 mt-0.5">
            Tomorrow
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black text-white flex items-center justify-center shadow-2xs shrink-0">
            <MapPin className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-2">
            Delivery
          </span>
          <span className="text-xs sm:text-sm font-semibold text-neutral-800 mt-0.5 whitespace-nowrap">
            {deliveryDates.start} – {deliveryDates.end}
          </span>
        </div>
      </div>
      */}
      {/* ======================= END TEMPORARILY HIDDEN ======================= */}

      {/* Integrated Pincode Check Form */}
      {handleCheckPincode && (
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-left">
            <Truck className="w-4 h-4 text-brand-dark stroke-[1.75]" />
            <h4 className="text-xs font-bold tracking-[0.18em] uppercase text-brand-dark font-sans">
              DELIVERY AVAILABILITY & TIMELINE
            </h4>
          </div>
          <p className="text-[11px] text-neutral-500 font-sans mb-3 text-left leading-relaxed">
            Enter your 6-digit postal pincode to check instant atelier delivery and courier serviceability.
          </p>

          <form onSubmit={handleCheckPincode} className="flex gap-2 font-sans items-center">
            <input
              type="text"
              value={pincode || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPincode && setPincode(val);
                if (setPincodeResult && pincodeResult) setPincodeResult(null);
              }}
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              className="flex-1 bg-white border border-neutral-300 focus:border-black focus:outline-hidden px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 font-sans tracking-wide transition-colors h-11"
            />
            <button
              type="submit"
              disabled={checkingPincode}
              className="bg-black hover:bg-neutral-800 text-white px-6 text-xs font-bold tracking-[0.2em] uppercase transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center min-w-[85px] h-11 shadow-2xs font-sans"
            >
              {checkingPincode ? 'CHECKING...' : 'CHECK'}
            </button>
          </form>

          {/* Validation or Network Error */}
          {(pincodeResult?.status === 'invalid' || pincodeResult?.status === 'error') && (
            <div className="flex items-center gap-2 text-xs text-rose-600 mt-2.5 font-sans text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{pincodeResult.message}</span>
            </div>
          )}

          {/* Unserviceable PIN Code Notice */}
          {pincodeResult?.status === 'unserviceable' && (
            <div className="flex items-center gap-2 text-xs text-rose-700 mt-2.5 pt-2.5 border-t border-neutral-200 font-sans text-left">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pincodeResult.message || 'Delivery currently unavailable for this pincode.'}</span>
            </div>
          )}

          {/* Serviceable PIN Code Success Result */}
          {pincodeResult?.status === 'success' && (() => {
            const d = pincodeResult.dateObj;
            return (
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-800 mt-2.5 pt-2.5 border-t border-neutral-200 font-sans text-left">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span>
                  Delivery between{' '}
                  <span className="font-semibold text-neutral-950">
                    {d?.day1 || 8}<sup>{d?.ord1 || 'th'}</sup> and {d?.day2 || 9}<sup>{d?.ord2 || 'th'}</sup> {d?.month || 'Oct'}
                  </span>
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default DeliveryReminderWidget;

