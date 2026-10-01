import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Package,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // all, 5, 4, 3, 2, 1

  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReviews = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRevalidating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await apiClient('/api/reviews');
      const list = res?.data || (Array.isArray(res) ? res : []);
      setReviews(list);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err.message || 'Failed to fetch customer reviews from server');
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(false);
    // Realtime auto-refresh every 30s
    const timer = setInterval(() => {
      fetchReviews(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchReviews]);

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;
    setDeletingId(id);

    try {
      await apiClient(`/api/reviews/${id}`, {
        method: 'DELETE',
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('success', 'Review deleted successfully.');
    } catch (err) {
      showToast('error', `Failed to delete review: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Client Filter
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (r.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === 'all' || Number(r.rating) === Number(ratingFilter);

    return matchesSearch && matchesRating;
  });

  const totalFiltered = filteredReviews.length;
  const totalPages = Math.ceil(totalFiltered / limit) || 1;
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * limit, currentPage * limit);

  // Ratings calculation
  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalReviewsCount).toFixed(1)
    : '0.0';

  const fiveStarCount = reviews.filter((r) => Number(r.rating) === 5).length;
  const lowStarCount = reviews.filter((r) => Number(r.rating) <= 2).length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-2xl text-sm font-admin border bg-neutral-950 text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 min-w-[340px] max-w-[480px] ${
            toast.type === 'success' ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-rose-500/40 shadow-rose-950/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.2]" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 stroke-[2.2]" />
          )}
          <span className="font-admin font-semibold tracking-wide text-xs sm:text-sm text-white leading-snug">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-brand-dark tracking-tight">
            Product Reviews & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Realtime customer feedback, store rating statistics, and moderation control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isRevalidating && (
            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 mr-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Live Syncing...</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchReviews(false)}
            disabled={loading || isRevalidating}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Total Reviews
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 stroke-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-brand-dark mt-2">
            {totalReviewsCount}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Average Rating
            </span>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-center justify-center font-bold text-xs">
              ★ {avgRating}
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-brand-dark mt-2 flex items-center gap-2">
            <span>{avgRating}</span>
            <span className="text-xs font-sans text-neutral-400 font-normal">/ 5.0</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              5-Star Feedback
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
              5★
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-emerald-700 mt-2">
            {fiveStarCount}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Critical (1-2★)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-xs">
              ⚠️
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-rose-700 mt-2">
            {lowStarCount}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by product name, reviewer, or text..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-neutral-50 border border-neutral-200 text-brand-dark text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white font-medium cursor-pointer"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/50">
          <h2 className="text-xs font-semibold tracking-wider text-brand-dark uppercase">
            Product Feedback <span className="ml-1 px-2 py-0.5 bg-neutral-200/60 rounded-full text-neutral-700 text-[11px]">{totalFiltered}</span>
          </h2>
        </div>

        {error && !loading && (
          <div className="p-6 bg-rose-50 border-b border-rose-200 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-rose-900 mb-1">Failed to load customer reviews</h4>
            <p className="text-xs text-rose-700 mb-4">{error}</p>
            <button
              onClick={() => fetchReviews(false)}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-neutral-50/80 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4 w-32">Rating</th>
                <th className="py-3 px-4">Review Comment</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 text-xs text-brand-dark">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-36" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-64" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-20" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 w-8 bg-neutral-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Star className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-brand-dark mb-1">No customer reviews found</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      {searchQuery || ratingFilter !== 'all'
                        ? 'No reviews match your search or star rating filter.'
                        : 'No reviews have been submitted by customers yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((rev) => {
                  const ratingNum = Number(rev.rating) || 5;
                  const dateStr = rev.date
                    ? new Date(rev.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={rev.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-brand-dark">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span>{rev.product_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-neutral-700">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{rev.username || 'Anonymous'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < ratingNum ? 'fill-amber-400 stroke-amber-500' : 'text-neutral-200 fill-neutral-100'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-neutral-700 leading-relaxed line-clamp-2">
                          "{rev.comment}"
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          disabled={deletingId === rev.id}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalFiltered > limit && (
          <div className="flex items-center justify-between border-t border-neutral-200/80 px-6 py-3.5 bg-neutral-50/50">
            <div className="text-xs text-neutral-500">
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalFiltered)} of {totalFiltered} reviews
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border text-xs bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                Previous
              </button>
              <span className="text-xs text-neutral-600 font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border text-xs bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
