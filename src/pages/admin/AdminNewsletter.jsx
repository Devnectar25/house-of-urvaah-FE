import React, { useState, useEffect, useCallback } from 'react';
import {
  MailCheck,
  Search,
  RefreshCw,
  Trash2,
  UserPlus,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  X,
  Radio,
  Tag,
  Mail,
  Users
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, today: 0, this_month: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | subscribed | unsubscribed
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Add Subscriber Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newStatus, setNewStatus] = useState('subscribed');
  const [newSource, setNewSource] = useState('admin');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action status loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Strict email validation for modal
  const validateModalEmail = (email) => {
    if (!email || !email.trim()) return 'Email address is required.';
    const trimmed = email.trim();
    if (trimmed.length > 254) return 'Email exceeds 254 characters.';
    if (trimmed.includes('..')) return 'Email cannot contain consecutive dots.';
    const parts = trimmed.split('@');
    if (parts.length !== 2) return 'Please enter a valid email with a single @ symbol.';
    const [local, domain] = parts;
    if (!local) return 'Please enter the username portion before @.';
    if (!domain || !domain.includes('.')) return 'Please provide a valid domain (e.g. domain.com).';
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2) return 'Please provide a valid top-level domain (e.g. .com, .in).';
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email format (e.g. name@domain.com).';
    return null;
  };

  // Fetch subscribers & stats
  const fetchData = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
          status: statusFilter,
          search: searchQuery.trim()
        });

        const [subscribersRes, statsRes] = await Promise.allSettled([
          apiClient(`/api/newsletter/admin/subscribers?${queryParams.toString()}`),
          apiClient('/api/newsletter/admin/stats')
        ]);

        if (subscribersRes.status === 'fulfilled') {
          const res = subscribersRes.value;
          setSubscribers(res?.data || []);
          if (res?.pagination) {
            setPagination({
              total: res.pagination.total || 0,
              totalPages: res.pagination.totalPages || 1
            });
          }
        } else {
          throw new Error(subscribersRes.reason?.message || 'Failed to load newsletter subscribers.');
        }

        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          setStats(statsRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load newsletter data:', err);
        setError(err.message || 'Unable to connect to newsletter API.');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, limit, statusFilter, searchQuery]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Handle Toggle Status
  const handleToggleStatus = async (subscriber) => {
    const nextStatus = subscriber.status === 'subscribed' ? 'unsubscribed' : 'subscribed';
    setActionLoadingId(subscriber.id);

    try {
      const res = await apiClient(`/api/newsletter/admin/subscribers/${subscriber.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });

      if (res?.success) {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === subscriber.id ? { ...s, status: nextStatus, updated_at: new Date().toISOString() } : s))
        );
        showToast(`Status updated to "${nextStatus}".`);
        fetchData(true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update subscriber status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Subscriber
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await apiClient(`/api/newsletter/admin/subscribers/${deleteTarget.id}`, {
        method: 'DELETE'
      });

      if (res?.success) {
        showToast(`Subscriber "${deleteTarget.email}" deleted successfully.`);
        setDeleteTarget(null);
        fetchData(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete subscriber.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Add Subscriber
  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    const valError = validateModalEmail(newEmail);
    if (valError) {
      setAddError(valError);
      return;
    }

    setIsAdding(true);
    setAddError('');

    try {
      const res = await apiClient('/api/newsletter/admin/subscribers', {
        method: 'POST',
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          status: newStatus,
          source: newSource || 'admin'
        })
      });

      if (res?.success) {
        showToast(`Subscriber "${newEmail.trim()}" added successfully.`);
        setIsAddModalOpen(false);
        setNewEmail('');
        setNewStatus('subscribed');
        setNewSource('admin');
        fetchData(false);
      }
    } catch (err) {
      setAddError(err.message || 'Failed to add subscriber.');
    } finally {
      setIsAdding(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast('No subscriber data to export.', 'error');
      return;
    }

    const headers = ['Email', 'Status', 'Source', 'IP Address', 'Subscribed Date'];
    const rows = subscribers.map((s) => [
      `"${s.email}"`,
      `"${s.status}"`,
      `"${s.source || 'N/A'}"`,
      `"${s.ip_address || 'N/A'}"`,
      `"${s.created_at ? new Date(s.created_at).toLocaleString('en-IN') : 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `house_of_urvaah_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported successfully.');
  };

  // Copy email to clipboard
  const handleCopyEmail = (email, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans selection:bg-brand-dark selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold tracking-wide border transition-all animate-in fade-in duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-rose-50 border-rose-700'
              : 'bg-neutral-900 text-white border-neutral-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Newsletter Subscribers"
        subtitle="Manage store newsletter audience, subscription sources, and mailing lists."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing || loading}
              className="px-3.5 py-2 text-xs font-bold font-sans tracking-wider uppercase border border-neutral-300 hover:border-black bg-white text-neutral-800 transition-colors flex items-center gap-2 rounded-lg cursor-pointer disabled:opacity-50"
              title="Refresh subscribers"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-bold font-sans tracking-wider uppercase border border-neutral-300 hover:border-black bg-white text-neutral-800 transition-colors flex items-center gap-2 rounded-lg cursor-pointer"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => {
                setAddError('');
                setNewEmail('');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold font-sans tracking-wider uppercase bg-black hover:bg-neutral-800 text-white transition-colors flex items-center gap-2 rounded-lg cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Subscriber</span>
            </button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Subscribers */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Total Subscribers</span>
            <span className="p-2 bg-neutral-100 rounded-lg text-neutral-800">
              <MailCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {stats.total.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-400 font-medium block mt-1">All-time audience signups</span>
        </div>

        {/* Active Subscribers */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Audience</span>
            <span className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
            {stats.active.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-1">Ready for campaigns & runway drops</span>
        </div>

        {/* Unsubscribed */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Unsubscribed</span>
            <span className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {stats.unsubscribed.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-400 font-medium block mt-1">Opted out of email communications</span>
        </div>

        {/* Joined This Month */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Joined This Month</span>
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight">
            {stats.this_month.toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium block mt-1">
            {stats.today} new subscriber{stats.today === 1 ? '' : 's'} today
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-lg self-start">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-black shadow-xs font-extrabold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => {
              setStatusFilter('subscribed');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              statusFilter === 'subscribed'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => {
              setStatusFilter('unsubscribed');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              statusFilter === 'unsubscribed'
                ? 'bg-white text-neutral-800 shadow-xs font-extrabold'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            Unsubscribed ({stats.unsubscribed})
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by subscriber email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-lg outline-none focus:border-black transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="w-7 h-7 animate-spin text-neutral-700" />
            <span className="text-xs font-medium uppercase tracking-widest font-sans">Loading subscribers...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Failed to load subscriber list</h3>
            <p className="text-xs text-neutral-500 mb-4 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchData(false)}
              className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-colors"
            >
              Retry
            </button>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <MailCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1">
              No Newsletter Subscribers Found
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mb-5 font-normal">
              {searchQuery
                ? `No subscribers matched the search query "${searchQuery}".`
                : 'Subscribers who signup via the footer or homepage will appear here automatically.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-black"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Subscriber Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Origin Source</th>
                  <th className="py-3 px-4">Subscribed On</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {subscribers.map((item) => {
                  const isSubscribed = item.status === 'subscribed';
                  const isBusy = actionLoadingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 tracking-wide font-sans">{item.email}</span>
                          <button
                            onClick={() => handleCopyEmail(item.email, item.id)}
                            className="p-1 text-neutral-400 hover:text-black transition-colors rounded hover:bg-neutral-200/50"
                            title="Copy email"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSubscribed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                            }`}
                          />
                          {isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 uppercase tracking-wider bg-neutral-100/80 px-2 py-0.5 rounded border border-neutral-200">
                          <Tag className="w-3 h-3 text-neutral-400" />
                          {item.source || 'footer'}
                        </span>
                      </td>

                      {/* Subscribed On */}
                      <td className="py-3.5 px-4 text-neutral-500 font-sans">
                        {item.created_at ? (
                          <div>
                            <span className="font-medium text-neutral-800 block">
                              {new Date(item.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(item.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={isBusy}
                            className={`px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase rounded border transition-colors cursor-pointer disabled:opacity-50 ${
                              isSubscribed
                                ? 'border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-black'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : isSubscribed ? (
                              'Unsubscribe'
                            ) : (
                              'Resubscribe'
                            )}
                          </button>

                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete subscriber"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {subscribers.length > 0 && (
          <div className="py-3.5 px-4 sm:px-6 bg-neutral-50/50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-bold text-neutral-900">
                {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, pagination.total)}
              </span>
              <span>of</span>
              <span className="font-bold text-neutral-900">{pagination.total}</span>
              <span>subscribers</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-neutral-300 rounded px-2 py-1 text-xs outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage >= pagination.totalPages}
                  className="p-1.5 rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD SUBSCRIBER */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-neutral-100 rounded-lg text-black">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Add Newsletter Subscriber</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="e.g. client@houseofurvaah.com"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      if (addError) setAddError('');
                    }}
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 focus:border-black rounded-lg outline-none transition-all"
                  />
                </div>
                {addError && <p className="text-xs text-rose-600 font-medium mt-1.5">{addError}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('subscribed')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      newStatus === 'subscribed'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    Subscribed
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('unsubscribed')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      newStatus === 'unsubscribed'
                        ? 'border-neutral-900 bg-neutral-100 text-neutral-900'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    Unsubscribed
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Source / Tag
                </label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg outline-none focus:border-black cursor-pointer"
                >
                  <option value="admin">Admin Manual Entry</option>
                  <option value="vip_client">VIP Client List</option>
                  <option value="in_store">In-Store Store Walk-in</option>
                  <option value="runway_event">Runway Event Guest</option>
                  <option value="marketing_import">Marketing Campaign</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Subscriber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE SUBSCRIBER CONFIRMATION */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-neutral-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1.5">
              Delete Subscriber?
            </h3>
            <p className="text-xs text-neutral-500 mb-2">
              Are you sure you want to permanently remove subscriber:
            </p>
            <span className="font-semibold text-xs text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded block mb-5 break-all">
              {deleteTarget.email}
            </span>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 hover:bg-neutral-100 text-neutral-800 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
