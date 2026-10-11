import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, MapPin, AlertCircle, XCircle } from 'lucide-react';

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
    <div className="bg-[#FAF8F5] border border-[#E7E2D8] rounded-2xl p-4 sm:p-5 shadow-2xs font-sans text-brand-dark mb-4 space-y-4">
      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-neutral-800 tracking-tight font-sans text-left">
        3-5 Day Delivery PAN India
      </h3>

      {/* 3 Step Icons Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        {/* Step 1: Order In */}
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#65525F] text-white flex items-center justify-center shadow-2xs shrink-0">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-2">
            Order in
          </span>
          <span className="text-xs sm:text-sm font-bold text-red-600 tabular-nums mt-0.5 whitespace-nowrap">
            {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        </div>

        {/* Step 2: Ships Tomorrow */}
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#65525F] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Truck className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-2">
            Ships
          </span>
          <span className="text-xs sm:text-sm font-semibold text-neutral-800 mt-0.5">
            Tomorrow
          </span>
        </div>

        {/* Step 3: Delivery Window */}
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#65525F] text-white flex items-center justify-center shadow-2xs shrink-0">
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

      {/* Integrated Pincode Check Form */}
      {handleCheckPincode && (
        <div className="pt-2">
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
              className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 font-sans transition-colors h-11"
            />
            <button
              type="submit"
              disabled={checkingPincode}
              className="bg-[#65525F] hover:bg-[#54434f] text-white px-5 sm:px-6 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-60 flex items-center justify-center min-w-[80px] h-11"
            >
              {checkingPincode ? 'Checking...' : 'Check'}
            </button>
          </form>

          {/* Validation or Network Error */}
          {(pincodeResult?.status === 'invalid' || pincodeResult?.status === 'error') && (
            <div className="flex items-center gap-2 text-xs text-rose-600 mt-2.5 font-sans text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{pincodeResult.message}</span>
            </div>
          )}

          {/* Unserviceable PIN Code Notice */}
          {pincodeResult?.status === 'unserviceable' && (
            <div className="flex items-center gap-2 text-xs text-rose-600 mt-2.5 font-sans text-left">
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{pincodeResult.message}</span>
            </div>
          )}

          {/* Serviceable PIN Code Success Result */}
          {pincodeResult?.status === 'success' && (() => {
            const d = pincodeResult.dateObj;
            return (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-700 mt-2.5 font-sans text-left">
                <Truck className="w-4.5 h-4.5 text-[#65525F] flex-shrink-0" />
                <span>
                  Delivery between{' '}
                  <span className="font-semibold text-neutral-800">
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
