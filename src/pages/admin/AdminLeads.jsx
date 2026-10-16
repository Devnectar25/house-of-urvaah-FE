import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Inbox,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Tag,
  Save,
  Check,
  Loader2,
  FileText
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

export const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, new_count: 0, contacted_count: 0, resolved_count: 0 });
  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, new, contacted, resolved

  // Detail Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('new');
  const [modalNotes, setModalNotes] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lock background scroll when Lead Detail modal or Delete modal is open
  useModalScrollLock(Boolean(isDetailModalOpen || deleteTarget), () => {
    if (isDetailModalOpen && !isSavingDetails) {
      setIsDetailModalOpen(false);
    } else if (deleteTarget && !isDeleting) {
      setDeleteTarget(null);
    }
  });

  // Toast
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeads = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRevalidating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch both leads list and summary stats in parallel
      const [leadsRes, statsRes] = await Promise.allSettled([
        apiClient('/api/leads'),
        apiClient('/api/leads/stats')
      ]);

      if (leadsRes.status === 'fulfilled') {
        const list = leadsRes.value?.data || (Array.isArray(leadsRes.value) ? leadsRes.value : []);
        setLeads(list);
      } else {
        throw new Error(leadsRes.reason?.message || 'Failed to fetch leads list');
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      } else {
        // Fallback compute from list
        const rawList = leadsRes.value?.data || [];
        setStats({
          total: rawList.length,
          new_count: rawList.filter((l) => (l.status || 'new') === 'new').length,
          contacted_count: rawList.filter((l) => l.status === 'contacted').length,
          resolved_count: rawList.filter((l) => l.status === 'resolved').length
        });
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError(err.message || 'Failed to connect to leads API');
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(false);
    // Auto-sync every 30 seconds
    const timer = setInterval(() => {
      fetchLeads(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchLeads]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, limit]);

  // Client filtering
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (lead.name || '').toLowerCase().includes(q) ||
      (lead.email || '').toLowerCase().includes(q) ||
      (lead.phone || '').includes(q) ||
      (lead.subject || '').toLowerCase().includes(q) ||
      (lead.message || '').toLowerCase().includes(q);

    const leadStatus = (lead.status || 'new').toLowerCase();
    const matchesStatus = statusFilter === 'all' || leadStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalFiltered = filteredLeads.length;
  const totalPages = Math.ceil(totalFiltered / limit) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * limit, currentPage * limit);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Handle open details modal
  const handleOpenDetails = (lead) => {
    setSelectedLead(lead);
    setModalStatus(lead.status || 'new');
    setModalNotes(lead.notes || '');
    setIsDetailModalOpen(true);
  };

  // Handle save details (status + notes)
  const handleSaveDetails = async () => {
    if (!selectedLead) return;
    setIsSavingDetails(true);

    try {
      const res = await apiClient(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: modalStatus,
          notes: modalNotes
        })
      });

      const updated = res?.data || { ...selectedLead, status: modalStatus, notes: modalNotes };

      // Update state locally
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
      setSelectedLead((prev) => (prev ? { ...prev, ...updated } : null));

      showToast(`Lead status updated to "${modalStatus}".`);
      setIsDetailModalOpen(false);
      fetchLeads(true);
    } catch (err) {
      console.error('Failed to update lead:', err);
      showToast(err.message || 'Failed to update lead details', 'error');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Handle quick status toggle
  const handleQuickStatusChange = async (lead, newStatus) => {
    try {
      await apiClient(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)));
      showToast(`Updated status to "${newStatus}".`);
      fetchLeads(true);
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Handle delete lead
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await apiClient(`/api/leads/${deleteTarget.id}`, {
        method: 'DELETE'
      });

      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      showToast(`Lead from "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      if (selectedLead?.id === deleteTarget.id) {
        setIsDetailModalOpen(false);
      }
      fetchLeads(true);
    } catch (err) {
      console.error('Failed to delete lead:', err);
      showToast(err.message || 'Failed to delete lead', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'new').toLowerCase();
    switch (s) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            New
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Contacted
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-300">
            <CheckCircle2 className="w-3 h-3 text-neutral-500" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-brand-dark">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-2xl text-sm font-admin border bg-neutral-950 text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 min-w-[340px] max-w-[480px] ${
            toast.type === 'error'
              ? 'border-rose-500/40 shadow-rose-950/20'
              : 'border-emerald-500/40 shadow-emerald-950/20'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 stroke-[2.2]" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.2]" />
          )}
          <span className="font-admin font-semibold tracking-wide text-xs sm:text-sm text-white leading-snug">
            {toast.message}
          </span>
        </div>
      )}

      {/* Page Header Banner */}
      <AdminPageHeader
        title="Leads & Enquiries"
        icon={Inbox}
        subtitle="Realtime monitoring of customer contact submissions, bespoke styling requests, and boutique enquiries."
        actions={
          <div className="flex items-center gap-2.5">
            {isRevalidating && (
              <span className="inline-flex items-center gap-1 text-[11px] font-sans text-neutral-500 mr-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Live Syncing...</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchLeads(false)}
              disabled={loading || isRevalidating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-200/90 text-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Total Leads
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-brand-dark mt-2">
            {stats.total ?? leads.length}
          </div>
        </div>

        {/* New Leads */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              New / Unread
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-emerald-700 mt-2">
            {stats.new_count ?? leads.filter((l) => (l.status || 'new') === 'new').length}
          </div>
        </div>

        {/* Contacted */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Contacted
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-blue-700 mt-2">
            {stats.contacted_count ?? leads.filter((l) => l.status === 'contacted').length}
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Resolved
            </span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-admin font-bold text-neutral-700 mt-2">
            {stats.resolved_count ?? leads.filter((l) => l.status === 'resolved').length}
          </div>
        </div>
      </div>

      {/* Main Leads Table Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Card Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-neutral-50/40">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold font-admin tracking-wide uppercase text-neutral-900 flex items-center gap-2">
              <span>All Submissions</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-200/80 text-[11px] font-semibold text-neutral-700">
                {totalFiltered}
              </span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, phone, topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 outline-none focus:border-black transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="new">New / Unread</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Enquiry Subject</th>
                <th className="py-3 px-4">Message Snippet</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 text-xs text-brand-dark">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="h-4 bg-neutral-200 rounded w-32" />
                      <div className="h-3 bg-neutral-200 rounded w-20" />
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="h-3.5 bg-neutral-200 rounded w-36" />
                      <div className="h-3 bg-neutral-200 rounded w-24" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-5 bg-neutral-200 rounded w-28" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-48" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-24" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-6 w-16 bg-neutral-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-7 w-20 bg-neutral-200 rounded mx-ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-rose-900">{error}</p>
                    <button
                      type="button"
                      onClick={() => fetchLeads(false)}
                      className="mt-3 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Inbox className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-brand-dark mb-1">No enquiries found</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No submissions match your current search or status filter.'
                        : 'Customer enquiries submitted via the Contact Us page will be automatically listed here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-neutral-50/80 transition-colors">
                    {/* Client Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-sand text-brand-dark font-bold font-admin flex items-center justify-center uppercase text-xs shrink-0">
                          {(lead.name || 'C').charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-brand-dark text-xs">{lead.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">ID: #{lead.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1.5 text-neutral-700 hover:text-black no-underline hover:no-underline text-xs"
                        style={{ textDecoration: 'none' }}
                        title="Click to email client"
                      >
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{lead.email}</span>
                      </a>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 text-neutral-500 hover:text-black text-[11px]"
                          title="Click to call client"
                        >
                          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>+91 {lead.phone}</span>
                        </a>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                        <Tag className="w-3 h-3 text-neutral-400" />
                        {lead.subject || 'General Enquiry'}
                      </span>
                    </td>

                    {/* Message Snippet */}
                    <td className="py-3.5 px-4 text-xs text-neutral-600 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed" title={lead.message}>
                        {lead.message}
                      </p>
                    </td>

                    {/* Received Date */}
                    <td className="py-3.5 px-4 text-xs text-neutral-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </td>

                    {/* Status Pill with Quick Switch */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center">
                        {getStatusBadge(lead.status)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(lead)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-900 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="View Full Lead Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(lead)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Controls */}
        {!loading && totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200/80 px-6 py-3.5 bg-neutral-50/50 gap-3">
            <div className="flex items-center gap-3 text-xs text-neutral-500 font-sans">
              <span>
                Showing <span className="font-semibold text-neutral-800">{(currentPage - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-neutral-800">
                  {Math.min(currentPage * limit, totalFiltered)}
                </span>{' '}
                of <span className="font-semibold text-neutral-800">{totalFiltered}</span> leads
              </span>
              <div className="flex items-center gap-1.5 ml-2 border-l border-neutral-200 pl-3">
                <span className="text-neutral-400">Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-xs text-neutral-700 outline-none focus:border-black cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-sans">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter((pageNum) => {
                    if (totalPages <= 7) return true;
                    if (pageNum === 1 || pageNum === totalPages) return true;
                    if (Math.abs(pageNum - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((pageNum, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && pageNum - prevPage > 1;

                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && (
                          <span className="text-xs text-neutral-400 px-1 select-none">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-neutral-900 text-white shadow-2xs'
                              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LEAD DETAILS MODAL                                                        */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedLead && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingDetails) {
              setIsDetailModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-md animate-fadeIn overscroll-contain font-admin"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            minHeight: '100dvh',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-sand text-brand-dark font-bold font-admin flex items-center justify-center text-sm">
                  {(selectedLead.name || 'C').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold font-admin text-sm sm:text-base text-neutral-950">
                    {selectedLead.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono">Lead ID: #{selectedLead.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(modalStatus)}
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-200/70 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto overscroll-contain font-sans">
              {/* Contact Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-black no-underline hover:no-underline flex items-center gap-1.5"
                    style={{ textDecoration: 'none' }}
                  >
                    <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{selectedLead.email}</span>
                  </a>
                </div>

                <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                    Phone Number
                  </span>
                  {selectedLead.phone ? (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-black no-underline hover:no-underline flex items-center gap-1.5"
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>+91 {selectedLead.phone}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400 italic">Not provided</span>
                  )}
                </div>
              </div>

              {/* Subject & Submission Date */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 font-medium">Topic:</span>
                  <span className="font-semibold text-neutral-900">{selectedLead.subject || 'General Enquiry'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Received {formatDate(selectedLead.created_at)}</span>
                </div>
              </div>

              {/* Inquiry Message Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Customer Message</span>
                </label>
                <div className="p-4 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-800 leading-relaxed font-serif whitespace-pre-wrap">
                  {selectedLead.message}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block">
                  Update Lead Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'new', label: 'New / Unread', color: 'border-emerald-500 text-emerald-800 bg-emerald-50/70' },
                    { key: 'contacted', label: 'Contacted', color: 'border-blue-500 text-blue-800 bg-blue-50/70' },
                    { key: 'resolved', label: 'Resolved', color: 'border-neutral-500 text-neutral-800 bg-neutral-100' }
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setModalStatus(st.key)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        modalStatus === st.key
                          ? `${st.color} ring-2 ring-black/10 font-bold shadow-2xs`
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Admin Internal Notes</span>
                </label>
                <textarea
                  rows="3"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record customer preferences, contact attempts, or action items (visible only to admin team)..."
                  className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200/80 flex items-center justify-between bg-neutral-50/50">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(selectedLead);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Lead</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isSavingDetails}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingDetails ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deleteTarget && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setDeleteTarget(null);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-md animate-fadeIn font-admin overscroll-contain"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            minHeight: '100dvh',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 text-center animate-in zoom-in-95 duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto mb-3 flex items-center justify-center border border-rose-200">
              <Trash2 className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 mb-1">Delete Lead?</h3>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed font-sans">
              Are you sure you want to delete the enquiry from{' '}
              <strong className="text-neutral-900 font-semibold">{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminLeads;
