import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Bug,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  Globe,
  Monitor,
  Flame,
  AlertOctagon,
  Info,
  Sparkles,
  Save,
  Layers,
  ArrowUpDown,
  Code
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { sendErrorReport } from '../../services/errorTracker';

export const AdminErrorMonitoring = () => {
  // Error list & pagination
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Statistics
  const [stats, setStats] = useState({
    totalErrors: 0,
    uniqueErrors: 0,
    uniqueUnresolved: 0,
    unresolvedErrors: 0,
    investigatingErrors: 0,
    resolvedErrors: 0,
    criticalErrors: 0,
    errorsLast24h: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  // UI States
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearMode, setClearMode] = useState('resolved');
  const [isClearing, setIsClearing] = useState(false);
  const [notesState, setNotesState] = useState({});

  // Show Toast Helper
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch Error Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient('/api/error-logs/stats', { isAdmin: true });
      if (res && res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch error statistics:', err.message);
    }
  }, []);

  // Fetch Error Logs
  const fetchErrorLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(pageSize));

      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (errorTypeFilter !== 'all') params.append('errorType', errorTypeFilter);
      if (timeRange !== 'all') params.append('timeRange', timeRange);

      const res = await apiClient(`/api/error-logs?${params.toString()}`, { isAdmin: true });
      if (res && res.success) {
        setErrors(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      showToast('Failed to load error logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, severityFilter, errorTypeFilter, timeRange, showToast]);

  // Initial & Dependency Load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]);

  // Handle Update Status
  const handleUpdateStatus = async (errId, newStatus, groupedIds = null) => {
    setUpdatingId(errId);
    try {
      const note = notesState[errId];
      const body = { status: newStatus };
      if (note !== undefined) body.notes = note;
      if (Array.isArray(groupedIds) && groupedIds.length > 0) body.ids = groupedIds;

      const res = await apiClient(`/api/error-logs/${errId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        isAdmin: true
      });

      if (res && res.success) {
        setErrors((prev) =>
          prev.map((item) => (item.id === errId ? { ...item, ...res.data, status: newStatus } : item))
        );
        fetchStats();
        showToast(
          groupedIds && groupedIds.length > 1
            ? `All ${groupedIds.length} occurrences marked as ${newStatus}.`
            : `Error #${errId} marked as ${newStatus}.`
        );
      }
    } catch (err) {
      showToast('Failed to update error status: ' + err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Save Note
  const handleSaveNote = async (errId, groupedIds = null) => {
    setUpdatingId(errId);
    try {
      const note = notesState[errId] || '';
      const body = { notes: note };
      if (Array.isArray(groupedIds) && groupedIds.length > 0) body.ids = groupedIds;

      const res = await apiClient(`/api/error-logs/${errId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        isAdmin: true
      });

      if (res && res.success) {
        setErrors((prev) =>
          prev.map((item) => (item.id === errId ? { ...item, notes: note } : item))
        );
        showToast('Developer notes saved.');
      }
    } catch (err) {
      showToast('Failed to save note: ' + err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Delete Single / Grouped Error
  const handleDeleteError = async (errId, groupedIds = null) => {
    const isMulti = Array.isArray(groupedIds) && groupedIds.length > 1;
    const confirmPrompt = isMulti
      ? `Are you sure you want to delete all ${groupedIds.length} occurrences of this error?`
      : `Are you sure you want to delete error record #${errId}?`;

    if (!window.confirm(confirmPrompt)) return;
    setDeletingId(errId);
    try {
      const url = groupedIds && groupedIds.length > 0
        ? `/api/error-logs/${errId}?ids=${groupedIds.join(',')}`
        : `/api/error-logs/${errId}`;

      const res = await apiClient(url, {
        method: 'DELETE',
        isAdmin: true
      });

      if (res && res.success) {
        setErrors((prev) => prev.filter((item) => item.id !== errId));
        setTotal((prev) => Math.max(0, prev - 1));
        fetchStats();
        showToast(res.message || `Error record #${errId} deleted.`);
      }
    } catch (err) {
      showToast('Failed to delete error record: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Bulk Clear
  const handleClearErrors = async () => {
    setIsClearing(true);
    try {
      const res = await apiClient('/api/error-logs/clear', {
        method: 'POST',
        body: JSON.stringify({ mode: clearMode }),
        isAdmin: true
      });

      if (res && res.success) {
        setShowClearModal(false);
        fetchErrorLogs();
        fetchStats();
        showToast(res.message || 'Error logs cleared successfully.');
      }
    } catch (err) {
      showToast('Failed to clear error logs: ' + err.message, 'error');
    } finally {
      setIsClearing(false);
    }
  };

  // Copy Stack Trace Helper
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trigger Synthetic Test Error (To demonstrate live error capture end-to-end)
  const handleTriggerTest = async (type) => {
    try {
      if (type === 'console') {
        console.error('Synthetic console.error triggered by Admin Error Monitoring Panel at ' + new Date().toLocaleTimeString());
        showToast('Triggered console.error() — report transmitted to database.');
      } else if (type === 'unhandled_rejection') {
        setTimeout(() => {
          Promise.reject(new Error('Synthetic Unhandled Promise Rejection (async test at ' + new Date().toLocaleTimeString() + ')'));
        }, 10);
        showToast('Triggered unhandled Promise rejection.');
      } else {
        // Direct UI error report
        await sendErrorReport({
          errorMessage: 'Synthetic UI/Functional Error Test (Admin Verified)',
          errorName: 'SimulatedUIException',
          errorStack: 'SimulatedUIException: Component state breakdown\n  at AdminErrorMonitoring.handleTriggerTest (AdminErrorMonitoring.jsx:215:10)',
          errorType: 'ui',
          severity: 'error',
          url: window.location.href
        });
        showToast('Synthetic UI error report sent successfully.');
      }

      // Re-fetch after 600ms to display newly captured error
      setTimeout(() => {
        fetchErrorLogs();
        fetchStats();
      }, 700);
    } catch (err) {
      showToast('Test trigger failed: ' + err.message, 'error');
    }
  };

  // Reset Filters Helper
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSeverityFilter('all');
    setErrorTypeFilter('all');
    setTimeRange('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    statusFilter !== 'all' ||
    severityFilter !== 'all' ||
    errorTypeFilter !== 'all' ||
    timeRange !== 'all'
  );

  // Time formatting helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Type badge styling helper
  const getTypeBadge = (type) => {
    switch (type) {
      case 'ui':
        return { label: 'UI Crash', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'functional':
        return { label: 'Runtime JS', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'unhandled_rejection':
        return { label: 'Promise Rejection', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'console':
        return { label: 'Console.error', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'network':
        return { label: 'API Failure', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      default:
        return { label: type || 'Exception', bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
    }
  };

  // Severity badge styling helper
  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'fatal':
        return { label: 'FATAL', bg: 'bg-rose-600 text-white font-bold' };
      case 'error':
        return { label: 'ERROR', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'warn':
        return { label: 'WARN', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'INFO', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  // Status badge styling helper
  const getStatusBadge = (st) => {
    switch (st) {
      case 'resolved':
        return { label: 'Resolved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'investigating':
        return { label: 'Investigating', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Unresolved', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold tracking-wide transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-800 shadow-rose-950/20'
              : 'bg-neutral-900/95 text-white border-neutral-800 shadow-black/20'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <AdminPageHeader
        title="Error Monitoring"
        subtitle="Automatic real-time UI, functional & console exception telemetry stored in the database."
        icon={ShieldAlert}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Live Telemetry Active
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Test Trigger Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-xl border border-neutral-300 shadow-2xs transition-colors cursor-pointer"
                title="Test error capture pipeline"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Trigger</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>
              <div className="absolute right-0 mt-1 w-52 bg-white border border-neutral-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-30 font-sans">
                <button
                  type="button"
                  onClick={() => handleTriggerTest('ui')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-neutral-100 font-medium text-neutral-700 flex items-center gap-2 cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  Test UI Exception
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerTest('console')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-neutral-100 font-medium text-neutral-700 flex items-center gap-2 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-sky-500" />
                  Test console.error()
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerTest('unhandled_rejection')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-neutral-100 font-medium text-neutral-700 flex items-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
                  Test Promise Rejection
                </button>
              </div>
            </div>

            {/* Clear / Purge Button */}
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-neutral-700 hover:text-rose-600 text-xs font-semibold rounded-xl border border-neutral-300 hover:border-rose-300 shadow-2xs transition-colors cursor-pointer"
              title="Purge logs from database"
            >
              <Trash2 className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-600" />
              <span>Purge</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchErrorLogs();
                fetchStats();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 2. KPI / Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Errors */}
        <div
          onClick={() => { setStatusFilter('all'); setSeverityFilter('all'); }}
          className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs cursor-pointer hover:border-neutral-400 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unique Issues</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans">
            {(stats.uniqueErrors || stats.totalErrors || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {stats.uniqueErrors ? `${stats.totalErrors.toLocaleString()} total firings captured` : 'All caught UI & functional issues'}
          </div>
        </div>

        {/* Unresolved Issues */}
        <div
          onClick={() => setStatusFilter('unresolved')}
          className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs cursor-pointer hover:border-neutral-400 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unresolved</span>
            <AlertOctagon className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans">
            {(stats.uniqueUnresolved !== undefined ? stats.uniqueUnresolved : stats.unresolvedErrors).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {stats.uniqueUnresolved !== undefined ? `${stats.unresolvedErrors.toLocaleString()} occurrences pending` : 'Active errors requiring attention'}
          </div>
        </div>

        {/* Critical / Fatal */}
        <div
          onClick={() => setSeverityFilter('fatal')}
          className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs cursor-pointer hover:border-neutral-400 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical / Fatal</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans">
            {stats.criticalErrors.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            High severity render crashes
          </div>
        </div>

        {/* Errors in Last 24 Hours */}
        <div
          onClick={() => setTimeRange('24h')}
          className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs cursor-pointer hover:border-neutral-400 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Past 24 Hours</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans">
            {stats.errorsLast24h.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Newly detected exceptions today
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search error message, URL, name, or user..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="unresolved">Unresolved Only</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Error Type Filter */}
          <div>
            <select
              value={errorTypeFilter}
              onChange={(e) => {
                setErrorTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="ui">UI Crash (React)</option>
              <option value="functional">Runtime JS</option>
              <option value="console">Console.error</option>
              <option value="unhandled_rejection">Promise Rejection</option>
              <option value="network">API / Network</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 flex-wrap text-xs">
            <span className="text-[11px] font-semibold text-neutral-400">Active filters:</span>
            {search && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                Search: "{search}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                Status: {statusFilter}
              </span>
            )}
            {errorTypeFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                Type: {errorTypeFilter}
              </span>
            )}
            {timeRange !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                Range: {timeRange}
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold no-underline hover:no-underline ml-auto cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* 4. Error Logs List */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-start gap-4 p-4 border border-neutral-100 rounded-xl">
                <div className="w-10 h-10 bg-neutral-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-1/3" />
                  <div className="h-3 bg-neutral-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : errors.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              No errors detected
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-5 leading-relaxed">
              {hasActiveFilters
                ? 'No error logs match your active filters. Try clearing filters or searching for something else.'
                : 'All clear! No UI crashes, functional errors, or uncaught console exceptions have been recorded.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl border border-neutral-300 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleTriggerTest('ui')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Trigger Test Error to Verify Pipeline
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {errors.map((item) => {
              const isExpanded = expandedRowId === item.id;
              const typeBadge = getTypeBadge(item.error_type);
              const statusBadge = getStatusBadge(item.status);
              const sevBadge = getSeverityBadge(item.severity);

              return (
                <div
                  key={item.id}
                  className={`transition-colors ${isExpanded ? 'bg-neutral-50/70' : 'hover:bg-neutral-50/40'}`}
                >
                  {/* Item Summary Bar */}
                  <div
                    onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Left Status Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          item.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : item.severity === 'fatal'
                            ? 'bg-rose-100 text-rose-700 border-rose-300'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                      >
                        {item.status === 'resolved' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      {/* Main Message & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge.bg}`}>
                            {typeBadge.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>

                          {/* Occurrence / Firing Count Badge */}
                          {item.occurrence_count && item.occurrence_count > 1 ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs font-mono tracking-tight"
                              title={`This error fired ${item.occurrence_count} times`}
                            >
                              <Flame className="w-3 h-3 fill-white text-white" />
                              {item.occurrence_count}x occurrences
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono">
                              1x
                            </span>
                          )}

                          <span className="text-[11px] font-mono text-neutral-400">
                            #{item.id}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-sans">
                            • {formatTimeAgo(item.created_at)}
                            {item.first_seen_at && item.occurrence_count > 1 && (
                              <span className="text-neutral-400 font-normal ml-1">
                                (first: {formatTimeAgo(item.first_seen_at)})
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Error Message */}
                        <div className="text-xs sm:text-sm font-semibold text-neutral-900 tracking-tight break-words font-mono">
                          <span className="text-neutral-500 font-normal mr-1">{item.error_name}:</span>
                          <span>{item.error_message}</span>
                        </div>

                        {/* Context summary row */}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500 font-sans flex-wrap">
                          {item.url && (
                            <span className="inline-flex items-center gap-1 text-neutral-600 truncate max-w-xs" title={item.url}>
                              <Globe className="w-3 h-3 shrink-0 text-neutral-400" />
                              <span className="truncate">{item.url.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                            </span>
                          )}
                          {(item.browser || item.os) && (
                            <span className="inline-flex items-center gap-1 text-neutral-600">
                              <Monitor className="w-3 h-3 shrink-0 text-neutral-400" />
                              <span>{item.browser} on {item.os}</span>
                            </span>
                          )}
                          {item.user_email && (
                            <span className="inline-flex items-center gap-1 text-neutral-600">
                              <User className="w-3 h-3 shrink-0 text-neutral-400" />
                              <span>{item.user_email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Expand / Status Toggle */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(
                            item.id,
                            item.status === 'resolved' ? 'unresolved' : 'resolved',
                            item.grouped_ids
                          );
                        }}
                        disabled={updatingId === item.id}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          item.status === 'resolved'
                            ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {item.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                      </button>

                      <div className="w-7 h-7 rounded-lg text-neutral-400 flex items-center justify-center">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-neutral-100 bg-neutral-50/50 space-y-4 font-sans text-xs">
                      {/* Occurrence & Record Info Row */}
                      {item.occurrence_count && item.occurrence_count > 1 && (
                        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-950 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-semibold">
                              Consolidated Error: Fired {item.occurrence_count} times. Showing latest client telemetry.
                            </span>
                          </div>
                          {item.grouped_ids && item.grouped_ids.length > 0 && (
                            <span className="text-[11px] font-mono text-amber-800">
                              DB IDs: #{item.grouped_ids.slice(0, 10).join(', #')}
                              {item.grouped_ids.length > 10 ? ` +${item.grouped_ids.length - 10} more` : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {/* URL & Full Path Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-neutral-200 text-neutral-700">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Occurrence Page</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-dark hover:text-black no-underline hover:no-underline flex items-center gap-1 truncate font-mono text-[11px]"
                            style={{ textDecoration: 'none' }}
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-neutral-400" />
                          </a>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Environment & Device</span>
                          <span className="font-medium text-[11px]">
                            {item.browser} • {item.os} ({item.device_type || 'Desktop'})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Recorded Timestamp</span>
                          <span className="font-mono text-[11px]">
                            {new Date(item.created_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'medium'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Stack Trace Code Box */}
                      {item.error_stack && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                              <Code className="w-3.5 h-3.5 text-neutral-500" />
                              Stack Trace
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.error_stack, `stack-${item.id}`)}
                              className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 cursor-pointer font-medium"
                            >
                              {copiedId === `stack-${item.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-400" />
                                  <span>Copy Stack</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-neutral-950 text-rose-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-neutral-900 shadow-inner select-text">
                            {item.error_stack}
                          </pre>
                        </div>
                      )}

                      {/* Component Stack (For React crashes) */}
                      {item.component_stack && (
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 block mb-1.5">
                            React Component Hierarchy
                          </span>
                          <pre className="p-3.5 rounded-xl bg-neutral-900 text-sky-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-48 border border-neutral-800 shadow-inner select-text">
                            {item.component_stack}
                          </pre>
                        </div>
                      )}

                      {/* Developer / Admin Notes & Status Selector */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-neutral-200">
                        {/* Status Radio Buttons */}
                        <div>
                          <span className="text-[11px] font-bold text-neutral-600 block mb-1.5">
                            Triage Status:
                          </span>
                          <div className="flex items-center gap-2">
                            {['unresolved', 'investigating', 'resolved'].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateStatus(item.id, st, item.grouped_ids)}
                                disabled={updatingId === item.id}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border capitalize cursor-pointer transition-colors ${
                                  item.status === st
                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                          {item.resolved_by && item.status === 'resolved' && (
                            <span className="text-[10px] text-neutral-400 mt-1 block">
                              Resolved by {item.resolved_by}
                            </span>
                          )}
                        </div>

                        {/* Notes Input */}
                        <div className="md:col-span-2">
                          <span className="text-[11px] font-bold text-neutral-600 block mb-1.5">
                            Developer Notes / Resolution Context:
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={notesState[item.id] !== undefined ? notesState[item.id] : item.notes || ''}
                              onChange={(e) =>
                                setNotesState({ ...notesState, [item.id]: e.target.value })
                              }
                              placeholder="e.g. Fixed in release commit, or external API timeout"
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNote(item.id, item.grouped_ids)}
                              disabled={updatingId === item.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteError(item.id, item.grouped_ids)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              title={item.occurrence_count > 1 ? `Delete all ${item.occurrence_count} occurrences` : 'Delete error record'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Pagination Footer - Always visible when errors exist */}
        {!loading && errors.length > 0 && (
          <div className="p-4 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-50/70">
            {/* Left: Item Counts and Page Size Dropdown */}
            <div className="flex items-center gap-3 text-xs text-neutral-600 font-sans flex-wrap">
              <div>
                Showing <strong className="text-neutral-900 font-bold">{total > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
                <strong className="text-neutral-900 font-bold">{Math.min(page * pageSize, total)}</strong> of{' '}
                <strong className="text-neutral-900 font-bold">{total}</strong> error {total === 1 ? 'group' : 'groups'}
                {stats.totalErrors > total && (
                  <span className="text-neutral-500 font-normal ml-1">
                    ({stats.totalErrors} total firings)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 border-l border-neutral-200 pl-3">
                <span className="text-neutral-400 text-[11px]">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs rounded-lg border border-neutral-200 bg-white font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>

            {/* Right: Interactive Page Numbers and Navigation */}
            <div className="flex items-center gap-1.5 select-none">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Previous
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                  if (totalPages > 7) {
                    if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - page) > 1) {
                      if (pNum === 2 || pNum === totalPages - 1) {
                        return (
                          <span key={pNum} className="px-1 text-xs text-neutral-400 font-mono">
                            …
                          </span>
                        );
                      }
                      return null;
                    }
                  }

                  const isActive = pNum === page;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`min-w-7 h-7 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center font-mono ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Purge / Clear Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xl font-sans space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Purge Error Logs
              </h3>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Select which error logs you want to permanently delete from the database:
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-xs font-medium">
                <input
                  type="radio"
                  name="clearMode"
                  value="resolved"
                  checked={clearMode === 'resolved'}
                  onChange={() => setClearMode('resolved')}
                  className="accent-neutral-900"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Only Resolved Errors</div>
                  <div className="text-[11px] text-neutral-500">Deletes logs marked as resolved, keeping active issues.</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-xs font-medium">
                <input
                  type="radio"
                  name="clearMode"
                  value="older_30d"
                  checked={clearMode === 'older_30d'}
                  onChange={() => setClearMode('older_30d')}
                  className="accent-neutral-900"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Older than 30 Days</div>
                  <div className="text-[11px] text-neutral-500">Deletes historical records older than one month.</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 cursor-pointer text-xs font-medium">
                <input
                  type="radio"
                  name="clearMode"
                  value="all"
                  checked={clearMode === 'all'}
                  onChange={() => setClearMode('all')}
                  className="accent-rose-600"
                />
                <div>
                  <div className="font-semibold text-rose-900">All Error Records</div>
                  <div className="text-[11px] text-rose-700">Wipes the entire client error logs database clean.</div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearErrors}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isClearing ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminErrorMonitoring;
