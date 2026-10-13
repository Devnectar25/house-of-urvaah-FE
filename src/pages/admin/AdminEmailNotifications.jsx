import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  FileText,
  CreditCard,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ExternalLink,
  Shield,
  Download,
  Info
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export const AdminEmailNotifications = () => {
  const [activeTab, setActiveTab] = useState('ORDER_CONFIRMATION'); // 'ORDER_CONFIRMATION' | 'PAYMENT_STATUS' | 'INVOICE' | 'ALL'
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selected Notification for Detail Modal
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient('/api/email-notifications/stats');
      if (res?.success && res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to load email notification stats:', err);
    }
  }, []);

  const fetchNotifications = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pagination.limit)
        });

        if (activeTab !== 'ALL') {
          params.append('workflowType', activeTab);
        }
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (debouncedSearch.trim()) {
          params.append('search', debouncedSearch.trim());
        }

        const res = await apiClient(`/api/email-notifications?${params.toString()}`);
        if (res?.success) {
          setNotifications(res.data || []);
          setPagination((prev) => ({
            ...prev,
            page: res.pagination?.page || page,
            total: res.pagination?.total || 0,
            totalPages: res.pagination?.totalPages || 1
          }));
        } else {
          setError(res?.message || 'Failed to retrieve notification records');
        }
      } catch (err) {
        setError(err.message || 'Failed to connect to notifications service');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, statusFilter, debouncedSearch, pagination.limit]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchNotifications(pagination.page);
  };

  const handleRetry = async (notificationId) => {
    setRetryingId(notificationId);
    try {
      const res = await apiClient(`/api/email-notifications/${notificationId}/retry`, {
        method: 'POST'
      });
      if (res?.success) {
        showToast('Notification re-queued and dispatched successfully!', 'success');
        fetchStats();
        fetchNotifications(pagination.page);
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification((prev) => ({ ...prev, status: 'sent', attempt_count: (prev.attempt_count || 1) + 1 }));
        }
      } else {
        showToast(res?.message || 'Failed to retry notification', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Retry dispatch failed', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  const getWorkflowBadge = (type) => {
    switch (type) {
      case 'ORDER_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            <PackageCheck className="w-3 h-3 text-stone-600" />
            Order Confirm
          </span>
        );
      case 'PAYMENT_STATUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <CreditCard className="w-3 h-3 text-amber-600" />
            Payment Status
          </span>
        );
      case 'INVOICE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <FileText className="w-3 h-3 text-emerald-600" />
            Invoice PDF
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-neutral-100 text-neutral-700">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Sent
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold bg-neutral-100 text-neutral-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded shadow-lg text-xs tracking-wider uppercase border transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Email Notifications"
        description="Monitor, audit, and safely retry strictly separated Order Confirmation, Payment Status, and Invoice delivery workflows."
      >
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wider uppercase bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors rounded shadow-sm disabled:opacity-50"
          title="Refresh Notification Log"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </AdminPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Dispatched</span>
            <Mail className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-900">{stats?.total_notifications || 0}</div>
          <div className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">Across all 3 workflows</div>
        </div>

        <div className="bg-white p-4 rounded border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Order Confirmations</span>
            <PackageCheck className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-serif text-stone-900">{stats?.order_confirmations || 0}</div>
          <div className="text-[10px] text-stone-500 mt-1 uppercase tracking-wider">Workflow 1 &bull; Created orders</div>
        </div>

        <div className="bg-white p-4 rounded border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Payment Status Updates</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif text-amber-900">{stats?.payment_updates || 0}</div>
          <div className="text-[10px] text-amber-600 mt-1 uppercase tracking-wider">Workflow 2 &bull; Verified state changes</div>
        </div>

        <div className="bg-white p-4 rounded border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Invoices Issued</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif text-emerald-900">{stats?.invoice_emails || 0}</div>
          <div className="text-[10px] text-emerald-600 mt-1 uppercase tracking-wider">Workflow 3 &bull; Verified PDF invoices</div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded border border-neutral-200 shadow-sm">
        {/* Navigation Tabs (Strictly Separated Workflows) */}
        <div className="border-b border-neutral-200 flex flex-wrap gap-2 px-4 pt-3 bg-neutral-50/50">
          <button
            onClick={() => {
              setActiveTab('ORDER_CONFIRMATION');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs tracking-wider uppercase font-semibold transition-colors border-b-2 ${
              activeTab === 'ORDER_CONFIRMATION'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            1. Order Confirmation Emails
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700">
              {stats?.order_confirmations || 0}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PAYMENT_STATUS');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs tracking-wider uppercase font-semibold transition-colors border-b-2 ${
              activeTab === 'PAYMENT_STATUS'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            2. Payment Status Emails
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700">
              {stats?.payment_updates || 0}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('INVOICE');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs tracking-wider uppercase font-semibold transition-colors border-b-2 ${
              activeTab === 'INVOICE'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            3. Invoice Delivery Emails
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700">
              {stats?.invoice_emails || 0}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ALL');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs tracking-wider uppercase font-semibold transition-colors border-b-2 ${
              activeTab === 'ALL'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            All Notification Logs
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Order #, Invoice #, or Recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-300 rounded focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-xs border border-neutral-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-neutral-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent ({stats?.sent_count || 0})</option>
              <option value="failed">Failed ({stats?.failed_count || 0})</option>
              <option value="pending">Pending ({stats?.pending_count || 0})</option>
            </select>
          </div>
        </div>

        {/* Notification Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4">Workflow &amp; Event</th>
                <th className="py-3 px-4">Order / Invoice</th>
                <th className="py-3 px-4">Authoritative Recipient</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-600" />
                    <span className="tracking-widest uppercase text-[11px]">Loading notifications audit logs...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-rose-600">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                    <span>{error}</span>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <Mail className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="uppercase tracking-widest text-[11px]">No notifications recorded for this filter</p>
                  </td>
                </tr>
              ) : (
                notifications.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div>{getWorkflowBadge(item.workflow_type)}</div>
                        <div className="text-[10px] text-neutral-400 font-mono tracking-tight">{item.event_type}</div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-serif font-medium text-neutral-900">
                        #{item.order_number || item.order_id?.slice(0, 8)}
                      </div>
                      {item.invoice_number && (
                        <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-medium">
                          {item.invoice_number}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900 truncate max-w-[200px]" title={item.recipient_email}>
                        {item.recipient_email}
                      </div>
                      {item.recipient_name && (
                        <div className="text-[10px] text-neutral-500 truncate max-w-[180px]">{item.recipient_name}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="truncate text-neutral-800" title={item.subject}>
                        {item.subject}
                      </div>
                      {item.has_attachment && (
                        <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <FileText className="w-2.5 h-2.5" />
                          <span>PDF Attached</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-neutral-700 text-xs">{item.attempt_count || 1}</span>
                    </td>

                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap text-[11px]">
                      {item.sent_at
                        ? new Date(item.sent_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : new Date(item.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedNotification(item)}
                          className="px-2 py-1 text-[10px] tracking-wider uppercase border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          Audit Details
                        </button>

                        {item.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(item.id)}
                            disabled={retryingId === item.id}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
                          >
                            {retryingId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <div>
            Showing <span className="font-medium text-neutral-900">{notifications.length}</span> of{' '}
            <span className="font-medium text-neutral-900">{pagination.total}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] uppercase tracking-wider">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchNotifications(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                  Notification Audit Log &bull; Record #{selectedNotification.id.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Workflow Type</span>
                  <div>{getWorkflowBadge(selectedNotification.workflow_type)}</div>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Current Status</span>
                  <div>{getStatusBadge(selectedNotification.status)}</div>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Order Identifier</span>
                  <div className="font-mono text-neutral-900 font-semibold">
                    #{selectedNotification.order_number || selectedNotification.order_id}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Invoice Number</span>
                  <div className="font-mono text-neutral-900">
                    {selectedNotification.invoice_number || 'N/A (Non-invoice workflow)'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Authoritative Recipient</span>
                  <div className="font-semibold text-neutral-900">{selectedNotification.recipient_email}</div>
                  <div className="text-neutral-500 text-[11px]">{selectedNotification.recipient_name || 'N/A'}</div>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Delivery Attempts</span>
                  <div className="font-mono text-neutral-800">{selectedNotification.attempt_count || 1}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Subject Header</span>
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded font-serif text-neutral-900">
                  {selectedNotification.subject}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Idempotency Key</span>
                <div className="p-2 bg-neutral-50 border border-neutral-200 rounded font-mono text-[11px] text-neutral-600 break-all">
                  {selectedNotification.idempotency_key}
                </div>
              </div>

              {selectedNotification.provider_message_id && (
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Provider Message ID</span>
                  <div className="font-mono text-neutral-700">{selectedNotification.provider_message_id}</div>
                </div>
              )}

              {selectedNotification.error_message && (
                <div>
                  <span className="text-[10px] text-rose-500 uppercase tracking-wider block mb-1">Failure Diagnostic</span>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 font-mono text-[11px]">
                    {selectedNotification.error_message}
                  </div>
                </div>
              )}

              {selectedNotification.secure_token && selectedNotification.workflow_type === 'INVOICE' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between">
                  <div className="text-[11px] text-emerald-900">
                    <strong>Invoice Download Token:</strong> Secured one-time customer link
                  </div>
                  <a
                    href={`/api/email-notifications/invoices/download/${selectedNotification.secure_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded text-[10px] tracking-wider uppercase font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                Created: {new Date(selectedNotification.created_at).toLocaleString('en-IN')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-3 py-1.5 text-xs border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-100 transition-colors uppercase tracking-wider"
                >
                  Close
                </button>
                {selectedNotification.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(selectedNotification.id)}
                    disabled={retryingId === selectedNotification.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors uppercase tracking-wider disabled:opacity-50"
                  >
                    {retryingId === selectedNotification.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Safe Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
