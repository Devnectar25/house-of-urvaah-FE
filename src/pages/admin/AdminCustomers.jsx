import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  Eye,
  ShieldAlert,
  UserCheck,
  UserX,
  CreditCard,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, limit]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCustomers = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRevalidating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await apiClient('/api/users');
      const list = res?.data || (Array.isArray(res) ? res : []);
      // Deduplicate by email address
      const map = new Map();
      for (const item of list) {
        const key = (item.email || item.id || '').toLowerCase().trim();
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, item);
        }
      }
      setCustomers(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err.message || 'Failed to fetch user profiles from backend');
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(false);
    // Real-time auto sync every 30 seconds
    const timer = setInterval(() => {
      fetchCustomers(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchCustomers]);

  const handleToggleStatus = async (user) => {
    if (togglingId) return;
    const username = user.id || user.name;
    setTogglingId(username);
    const previousState = user.active;

    // Optimistic UI update
    setCustomers((prev) =>
      prev.map((u) => ((u.id === username || u.name === username) ? { ...u, active: !previousState } : u))
    );

    try {
      const res = await apiClient(`/api/users/${encodeURIComponent(username)}/toggle-status`, {
        method: 'PATCH',
      });
      if (res && res.success) {
        showToast('success', `User "${user.name}" account set to ${res.active ? 'active' : 'inactive'}.`);
      }
    } catch (err) {
      // Rollback
      setCustomers((prev) =>
        prev.map((u) => ((u.id === username || u.name === username) ? { ...u, active: previousState } : u))
      );
      showToast('error', `Failed to update user status: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleViewCustomerDetails = async (user) => {
    setSelectedCustomer(user);
    setIsModalOpen(true);
    setDetailsLoading(true);
    setCustomerDetails(null);

    try {
      const username = user.email || user.id || user.name;
      const res = await apiClient(`/api/users/profile?username=${encodeURIComponent(username)}`);
      setCustomerDetails(res);
    } catch (err) {
      console.error('Failed to fetch customer profile details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Client filtering
  const filteredCustomers = customers.filter((cust) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (cust.name || '').toLowerCase().includes(q) ||
      (cust.email || '').toLowerCase().includes(q) ||
      (cust.phone || '').includes(q) ||
      (cust.formattedAddress || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cust.active) ||
      (statusFilter === 'inactive' && !cust.active);

    return matchesSearch && matchesStatus;
  });

  const totalFiltered = filteredCustomers.length;
  const totalPages = Math.ceil(totalFiltered / limit) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * limit, currentPage * limit);

  const activeCount = customers.filter((c) => c.active).length;
  const inactiveCount = customers.filter((c) => !c.active).length;
  const totalSpentAll = customers.reduce((acc, c) => acc + (Number(c.totalSpent) || 0), 0);

  return (
    <div className="space-y-4 pb-8 font-sans w-full">
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

      {/* Page Header Banner */}
      <AdminPageHeader
        title="Customer Directory"
        subtitle="Realtime monitoring of registered clients, account status, purchase history, and contact details."
        className="p-4 sm:p-5"
        actions={
          <div className="flex items-center gap-2">
            {isRevalidating && (
              <span className="inline-flex items-center gap-1 text-[11px] font-sans text-neutral-500 mr-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing...</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchCustomers(false)}
              disabled={loading || isRevalidating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200/90 text-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Total Customers
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-admin font-bold text-brand-dark mt-1">
            {customers.length}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Active Accounts
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-admin font-bold text-emerald-700 mt-1">
            {activeCount}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Inactive / Restricted
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-admin font-bold text-rose-700 mt-1">
            {inactiveCount}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-sans">
              Total Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-admin font-bold text-brand-dark mt-1">
            ₹{totalSpentAll.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Table Container with Integrated Search & Filter Header */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-3 sm:p-3.5 border-b border-neutral-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold tracking-wider text-brand-dark uppercase">
              Registered Customers
            </h2>
            <span className="px-2 py-0.5 bg-neutral-200/70 rounded-full text-neutral-800 text-[11px] font-bold">
              {totalFiltered}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, phone..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:border-brand-dark transition-all font-sans"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-neutral-200 text-brand-dark text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-dark font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {error && !loading && (
          <div className="p-6 bg-rose-50 border-b border-rose-200 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-rose-900 mb-1">Failed to load customer profiles</h4>
            <p className="text-xs text-rose-700 mb-4">{error}</p>
            <button
              onClick={() => fetchCustomers(false)}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs table-auto">
            <thead>
              <tr className="bg-neutral-50/90 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80">
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Contact Info</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Joined Date</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Orders</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Total Spent</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 text-xs text-brand-dark">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-3 space-y-1">
                      <div className="h-4 bg-neutral-200 rounded w-28" />
                      <div className="h-3 bg-neutral-200 rounded w-16" />
                    </td>
                    <td className="py-3 px-3 space-y-1">
                      <div className="h-3.5 bg-neutral-200 rounded w-32" />
                      <div className="h-3 bg-neutral-200 rounded w-20" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 bg-neutral-200 rounded w-36" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-neutral-200 rounded w-20" />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="h-4 bg-neutral-200 rounded w-8 mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-neutral-200 rounded w-16" />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="h-5 w-14 bg-neutral-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="h-6 w-14 bg-neutral-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-brand-dark mb-1">No customers found</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No customers match your active search or status filter.'
                        : 'No customer accounts exist in the database yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((user) => {
                  const memberDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';

                  const shortId = user.id ? (user.id.includes('@') ? user.id.split('@')[0] : user.id.slice(0, 10)) : 'N/A';

                  return (
                    <tr key={user.id || user.email} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-sand text-brand-dark font-bold font-admin flex items-center justify-center uppercase text-[11px] shrink-0">
                            {(user.name || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-brand-dark text-xs truncate max-w-[110px] md:max-w-[130px] lg:max-w-[160px]" title={user.name}>
                              {user.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[110px] md:max-w-[130px]" title={`ID: ${user.id}`}>
                              ID: {shortId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-neutral-700 text-xs truncate max-w-[130px] md:max-w-[160px] lg:max-w-[190px]" title={user.email}>
                          <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{user.email || 'N/A'}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-neutral-500 text-[10.5px] mt-0.5 whitespace-nowrap">
                            <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-xs">
                        {user.formattedAddress ? (
                          <div className="flex items-center gap-1.5 text-neutral-700 max-w-[120px] md:max-w-[150px] lg:max-w-[180px]" title={user.formattedAddress}>
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate font-sans leading-tight">
                              {user.formattedAddress}
                            </span>
                            {user.addresses && user.addresses.length > 1 && (
                              <span className="shrink-0 px-1 py-0.2 rounded text-[9.5px] bg-neutral-100 text-neutral-600 font-semibold border border-neutral-200" title={`${user.addresses.length} saved addresses`}>
                                +{user.addresses.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-[10.5px]">No address</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-xs text-neutral-600 whitespace-nowrap">
                        <div className="text-[11px] font-medium leading-tight">{memberDate}</div>
                      </td>

                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-brand-dark whitespace-nowrap">
                        {user.totalOrders || 0}
                      </td>

                      <td className="py-2.5 px-3 text-xs font-bold text-brand-dark whitespace-nowrap">
                        ₹{(user.totalSpent || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingId === (user.id || user.name)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {user.active ? (
                            <>
                              <UserCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewCustomerDetails(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded-lg text-[11px] font-semibold hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                          title="View Customer Profile"
                        >
                          <Eye className="w-3 h-3 shrink-0" />
                          <span>Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Controls */}
        {!loading && totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200/80 px-6 py-3.5 bg-neutral-50/50 gap-3">
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span>
                Showing <span className="font-semibold text-neutral-800">{(currentPage - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-neutral-800">
                  {Math.min(currentPage * limit, totalFiltered)}
                </span>{' '}
                of <span className="font-semibold text-neutral-800">{totalFiltered}</span> customers
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

            <div className="flex items-center gap-1.5">
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

      {/* Customer Profile Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-brand-dark p-1 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-neutral-100 pb-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-brand-dark text-white font-bold text-lg font-admin flex items-center justify-center uppercase">
                {(selectedCustomer.name || 'U').charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-admin font-bold text-brand-dark uppercase tracking-wide">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">User ID: {selectedCustomer.id}</p>
              </div>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center text-neutral-400 animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <span className="text-xs">Fetching profile and address records...</span>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Contact block */}
                <div className="bg-neutral-50 p-4 rounded-xl space-y-2 border border-neutral-200/60">
                  <h4 className="font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                    Account & Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Email</span>
                      <span className="font-medium text-neutral-800">{selectedCustomer.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Phone</span>
                      <span className="font-medium text-neutral-800">{selectedCustomer.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Account Status</span>
                      <span className={`inline-block font-semibold mt-0.5 ${selectedCustomer.active ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {selectedCustomer.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Total Spent</span>
                      <span className="font-bold text-brand-dark">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                {(() => {
                  const modalAddresses = (customerDetails?.addresses && customerDetails.addresses.length > 0)
                    ? customerDetails.addresses
                    : (selectedCustomer?.addresses || []);

                  return (
                    <div>
                      <h4 className="font-semibold text-brand-dark uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-neutral-500" />
                          <span>Saved Addresses ({modalAddresses.length})</span>
                        </span>
                      </h4>
                      {modalAddresses.length > 0 ? (
                        <div className="space-y-2.5">
                          {modalAddresses.map((addr, idx) => {
                            const recipient = addr.recipient_name || addr.fullName || addr.fullname || addr.name || selectedCustomer?.name;
                            const fullLine = addr.full_address || addr.street || addr.address_line1 || addr.address || 'Address on file';
                            const locationLine = [addr.city, addr.state].filter(Boolean).join(', ') + 
                              ((addr.postal_code || addr.pincode) ? ` - ${addr.postal_code || addr.pincode}` : '');
                            const phoneLine = addr.phone || addr.mobile;

                            return (
                              <div key={addr.id || idx} className="p-3.5 bg-neutral-50/80 border border-neutral-200/90 rounded-xl text-neutral-700 space-y-1.5 shadow-2xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-semibold text-brand-dark flex items-center gap-2">
                                    <span>{recipient}</span>
                                    {addr.address_label && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-200/80 text-neutral-800">
                                        {addr.address_label}
                                      </span>
                                    )}
                                    {addr.is_default && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-neutral-800 leading-relaxed">
                                  <div>{fullLine}</div>
                                  {locationLine && (
                                    <div className="text-neutral-600 font-medium mt-0.5">{locationLine}</div>
                                  )}
                                </div>
                                {phoneLine && (
                                  <div className="text-[11px] text-neutral-500 flex items-center gap-1 pt-1 border-t border-neutral-200/60">
                                    <Phone className="w-3 h-3 text-neutral-400" />
                                    <span>{phoneLine}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-neutral-400 italic">No saved address records found for this account.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Recent Orders Summary */}
                <div>
                  <h4 className="font-semibold text-brand-dark uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-neutral-500" />
                    <span>Recent Order Activity</span>
                  </h4>
                  {customerDetails?.ordersSummary && customerDetails.ordersSummary.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetails.ordersSummary.map((ord) => (
                        <div key={ord.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-brand-dark">#{ord.order_number || ord.id}</div>
                            <div className="text-[10px] text-neutral-400">
                              {new Date(ord.created_at).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-brand-dark">₹{Number(ord.total_amount || ord.total || 0).toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-emerald-700 font-semibold">{ord.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-400 italic">No previous order transactions on file.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
