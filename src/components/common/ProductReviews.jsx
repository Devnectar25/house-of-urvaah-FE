import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, MessageSquare, Plus, X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { apiClient, getStoredUser } from '../../lib/apiClient';

export const ProductReviews = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    average: '0.0',
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formName, setFormName] = useState(() => {
    const u = getStoredUser();
    return u?.fullname || u?.name || '';
  });
  const [formComment, setFormComment] = useState('');
  const [formFit, setFormFit] = useState('True to Size');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Extract clean numeric product ID
  const cleanId = String(productId || '').replace(/\D/g, '') || productId;

  const fetchReviews = async () => {
    if (!cleanId) return;
    try {
      setLoading(true);
      const res = await apiClient(`/api/reviews/${cleanId}`);
      if (res && res.success && res.data) {
        setReviews(res.data.reviews || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.warn('Reviews API load fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [cleanId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formComment.trim()) {
      setFormError('Please write your review feedback.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        productId: cleanId,
        username: formName.trim() || 'Verified Patron',
        rating: formRating,
        review: formFit ? `[Fit: ${formFit}] ${formComment.trim()}` : formComment.trim()
      };

      const res = await apiClient('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        setIsFormOpen(false);
        setFormComment('');
        setFormRating(5);
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 4500);
        // Refresh reviews list
        fetchReviews();
      } else {
        setFormError(res?.message || 'Could not submit review. Please try again.');
      }
    } catch (err) {
      setFormError(err.message || 'Error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return Number(r.rating) === Number(filterRating);
  });

  const ratingLabels = {
    1: 'Needs Improvement',
    2: 'Fair',
    3: 'Good Quality',
    4: 'Very Satisfied',
    5: 'Exceptional Atelier Piece'
  };

  const avgNum = parseFloat(summary.average) || 0;
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.username === 'Admin';

  return (
    <section id="customer-reviews" className="w-full mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-neutral-200/80 font-serif text-brand-dark scroll-mt-24">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-neutral-200/80">
        <div>
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.25em] uppercase text-neutral-400 font-semibold block mb-1.5">
            VERIFIED RATINGS & FEEDBACK
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif tracking-[0.1em] uppercase text-black font-semibold">
            CUSTOMER REVIEWS
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 font-sans mt-2 max-w-xl leading-relaxed">
            Real fit impressions, architectural silhouette feedback, and styling notes shared by House of Urvaah patrons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-end">
          {isAdmin && (
            <a
              href={`/admin/reviews?search=${encodeURIComponent(productName || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-sans font-semibold tracking-[0.16em] uppercase rounded-none transition-colors flex items-center gap-2 border border-neutral-300"
              title="Open Admin Review Desk for this product"
            >
              <ShieldCheck className="w-4 h-4 text-neutral-700" />
              <span>ADMIN REVIEWS</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              const u = getStoredUser();
              if (u && !formName) {
                setFormName(u.fullname || u.name || '');
              }
              setIsFormOpen(true);
            }}
            className="px-7 py-3.5 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-sans font-semibold tracking-[0.2em] uppercase rounded-none transition-colors flex items-center gap-2.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            WRITE A REVIEW
          </button>
        </div>
      </div>

      {/* Success Notification Toaster */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-8 p-4 bg-neutral-950 text-white border border-emerald-800/80 rounded-none flex items-center justify-between gap-3 shadow-xl font-sans text-xs tracking-wide"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Thank you! Your verified review has been submitted and added to this garment.</span>
            </div>
            <button onClick={() => setSuccessToast(false)} className="text-neutral-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Cards (Rating Metric Card & Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Card 1: Score & Star Rating */}
        <div className="lg:col-span-5 bg-[#FAF8F3] border border-[#E7E2D8] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-neutral-500 block mb-3">
              OVERALL RATING
            </span>

            <div className="flex items-baseline gap-4 mb-3">
              <span className="text-4xl sm:text-5xl font-serif font-bold text-black tracking-tight tabular-nums">
                {avgNum > 0 ? summary.average : '5.0'}
              </span>
              <span className="text-neutral-400 font-sans text-sm tracking-widest uppercase">
                / 5.0
              </span>
            </div>

            {/* Stars row */}
            <div className="flex items-center gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(avgNum || 5)
                      ? 'fill-black text-black'
                      : 'text-neutral-300'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs font-sans text-neutral-500 tracking-wide mt-1">
              {summary.total > 0
                ? `Based on ${summary.total} verified patron review${summary.total > 1 ? 's' : ''}`
                : 'Inaugural atelier piece. Patron ratings welcomed.'}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-neutral-200/80 flex items-center gap-2 text-xs font-sans text-neutral-700">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-[11px] tracking-wide">100% Verified purchases directly from House of Urvaah</span>
          </div>
        </div>

        {/* Card 2: Star Breakdown Progress Bars */}
        <div className="lg:col-span-7 bg-[#FAF8F3] border border-[#E7E2D8] rounded-2xl p-6 sm:p-8 flex flex-col justify-center space-y-3 shadow-2xs">
          <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-neutral-500 block mb-1">
            RATING DISTRIBUTION
          </span>

          {[5, 4, 3, 2, 1].map((ratingVal) => {
            const count = summary.distribution?.[ratingVal] || 0;
            const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;

            return (
              <div key={ratingVal} className="flex items-center gap-3 font-sans text-xs">
                <button
                  type="button"
                  onClick={() => setFilterRating(filterRating === String(ratingVal) ? 'all' : String(ratingVal))}
                  className={`flex items-center gap-1 w-14 hover:underline text-left cursor-pointer ${
                    filterRating === String(ratingVal) ? 'font-bold text-black' : 'text-neutral-700 font-medium'
                  }`}
                >
                  <span>{ratingVal}</span>
                  <Star className="w-3.5 h-3.5 fill-black text-black" />
                </button>

                {/* Progress bar line */}
                <div className="flex-1 h-2 bg-neutral-200/90 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-dark transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right text-neutral-500 tabular-nums text-[11px]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>


      {/* Reviews List / Empty State */}
      {loading ? (
        <div className="py-16 text-center bg-white border border-neutral-200/80 rounded-2xl">
          <div className="w-6 h-6 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-400 font-sans tracking-widest uppercase">Loading patron reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 sm:py-20 text-center bg-[#FAF8F3] border border-dashed border-[#E7E2D8] rounded-2xl p-8 font-sans">
          <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto mb-4 stroke-[1.5]" />
          <h3 className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-semibold mb-2">
            NO REVIEWS YET
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans max-w-md mx-auto mb-6 leading-relaxed">
            Be the first patron to share your styling notes, silhouette impressions, and tailoring feedback for {productName || 'this piece'}.
          </p>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-sans font-semibold tracking-[0.2em] uppercase transition-colors cursor-pointer"
          >
            WRITE THE INAUGURAL REVIEW
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((rev) => {
            const dateStr = rev.date
              ? new Date(rev.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Recent Purchase';

            const userInitials = (rev.user || 'A')
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={rev.id}
                className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-all text-left"
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#FAF8F3] border border-[#E7E2D8] flex items-center justify-center font-serif text-xs font-semibold text-black shrink-0">
                        {userInitials}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-serif font-semibold text-black uppercase tracking-wider">
                          {rev.user}
                        </h4>
                        <span className="text-[10px] text-emerald-800 font-sans font-semibold tracking-wider uppercase block">
                          VERIFIED PATRON ✓
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-neutral-400 font-sans tracking-wide">
                      {dateStr}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Number(rev.rating)
                            ? 'fill-black text-black'
                            : 'text-neutral-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment with Fit Badge */}
                  {rev.comment?.startsWith('[Fit:') ? (() => {
                    const match = rev.comment.match(/^\[Fit:\s*([^\]]+)\]\s*(.*)$/);
                    if (match) {
                      return (
                        <div className="space-y-1.5">
                          <span className="inline-block px-2.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] font-sans font-semibold uppercase tracking-wider rounded">
                            FIT: {match[1]}
                          </span>
                          <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
                            {match[2]}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
                        {rev.comment}
                      </p>
                    );
                  })() : (
                    <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
                      {rev.comment}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-5 text-left border border-neutral-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-neutral-400 block mb-0.5">
                    CLIENT FEEDBACK
                  </span>
                  <h3 className="text-lg sm:text-xl font-serif tracking-[0.1em] uppercase text-black font-semibold">
                    Write a Review
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[1.8]" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4 font-sans text-xs">
                {/* Interactive Star Rating */}
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-neutral-800 mb-2">
                    YOUR RATING <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (formHoverRating || formRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setFormHoverRating(star)}
                          onMouseLeave={() => setFormHoverRating(0)}
                          onClick={() => setFormRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              isFilled ? 'fill-black text-black' : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-medium text-neutral-600 ml-2">
                      {ratingLabels[formHoverRating || formRating]}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-neutral-800 mb-1.5">
                    YOUR NAME (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black font-sans"
                  />
                </div>

                {/* Fit pill selection */}
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-neutral-800 mb-1.5">
                    FIT FEEDBACK
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Runs Small', 'True to Size', 'Runs Large'].map((fit) => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => setFormFit(fit)}
                        className={`py-2 px-2 text-center text-[11px] font-semibold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                          formFit === fit
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-neutral-800 mb-1.5">
                    REVIEW DETAILS <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    required
                    placeholder="Describe how the fabric drapes, tailoring accuracy, quality of seams, and how you styled this piece..."
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-black font-sans resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-3 border border-neutral-300 text-neutral-700 hover:border-black hover:text-black uppercase tracking-[0.16em] font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-brand-dark hover:bg-neutral-800 text-white uppercase tracking-[0.16em] font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'SUBMITTING...' : 'PUBLISH REVIEW'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
