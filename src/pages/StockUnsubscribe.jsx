import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { SEOHead } from '../components/common/SEOHead';

export const StockUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage('No cancellation token provided in link.');
      return;
    }

    apiClient(`/api/stock-notifications/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setSuccess(true);
        setMessage(res?.message || 'Your notification request has been cancelled.');
      })
      .catch((err) => {
        setSuccess(false);
        setMessage(err.message || 'Invalid or expired unsubscribe link.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white p-4 font-serif pt-28">
      <SEOHead
        title="Unsubscribe from Stock Alerts | House of Urvaah"
        description="Manage your House of Urvaah back-in-stock notification preferences."
        noindex={true}
      />
      <div className="max-w-md w-full bg-[#FAF8F3] border border-neutral-200 p-8 text-center shadow-xs">
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-2">
          HOUSE OF URVAAH
        </span>
        <h1 className="text-xl font-normal tracking-widest uppercase mb-4 text-brand-dark">
          STOCK ALERT PREFERENCES
        </h1>

        {loading ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
            <p className="text-xs text-neutral-500 font-sans tracking-wide">
              Processing your request...
            </p>
          </div>
        ) : success ? (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-sans text-neutral-700 leading-relaxed">
              {message}
            </p>
            <p className="text-xs font-sans text-neutral-500">
              You will not receive any further restock notifications for this piece.
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-black text-white text-xs font-semibold tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors font-sans"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-sans text-neutral-700 leading-relaxed">
              {message}
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-black text-white text-xs font-semibold tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors font-sans"
              >
                <span>RETURN TO HOMEPAGE</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default StockUnsubscribe;
