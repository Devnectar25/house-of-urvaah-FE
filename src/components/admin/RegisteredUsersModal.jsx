import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Users, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// Helper to format date consistently with admin panel
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return 'N/A';
  }
}

export const RegisteredUsersModal = ({ isOpen, onClose, period = '30d' }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Dynamic Period Subtitle Label
  const periodLabel = useMemo(() => {
    if (period === 'today') return 'Today';
    if (period === '7d') return 'Last 7 Days';
    if (period === '30d') return 'Last 30 Days';
    return 'Selected Period';
  }, [period]);

  // Fetch real database registered users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/admin/users?period=${period}`).catch(() => null) ||
                  await apiClient('/api/admin/users').catch(() => null);

      if (res && (res.success || Array.isArray(res.data) || Array.isArray(res))) {
        const userList = res.data || (Array.isArray(res) ? res : []);
        setUsers(userList);
      } else {
        throw new Error(res?.message || 'Failed to retrieve registered users.');
      }
    } catch (err) {
      console.error('[RegisteredUsersModal Error]:', err);
      setError(err.message || 'Unable to load registered users. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Fetch data whenever modal opens or selected period changes
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [isOpen, fetchUsers]);

  // Filtered users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(u => {
      const name = (u.name || u.fullname || u.username || '').toLowerCase();
      const email = (u.email || u.emailid || '').toLowerCase();
      const phone = (u.phone || u.contactno || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [users, searchQuery]);

  // Reset to page 1 on search filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-admin">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] border border-neutral-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-admin text-neutral-900 tracking-tight">
                All Registered Users
              </h2>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">
                Detailed breakdown of metrics for {periodLabel}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh registered users"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Circular close button matching House of Urvaah theme outline */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-neutral-300 hover:border-neutral-900 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close modal"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar: Search & Count Summary */}
        <div className="px-6 py-3 border-b border-neutral-200/80 bg-neutral-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-sans text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 font-sans self-end sm:self-center">
            Showing <strong className="text-neutral-900 font-semibold">{filteredUsers.length}</strong> registered users ({periodLabel})
          </div>
        </div>

        {/* Modal Body / Table Content */}
        <div className="flex-1 overflow-y-auto custom-modal-scrollbar">
          {/* Error State */}
          {error && !loading && (
            <div className="p-8 m-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto">
              <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
              <h3 className="text-xs font-bold font-admin uppercase text-rose-900 mb-1">
                Unable to load registered users
              </h3>
              <p className="text-xs text-rose-700 font-sans mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={fetchUsers}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredUsers.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold font-admin text-neutral-900 uppercase tracking-wider mb-1">
                No users found for this period
              </h3>
              <p className="text-xs text-neutral-500 font-sans max-w-xs">
                {searchQuery
                  ? `No user records matched "${searchQuery}". Try a different search term.`
                  : `There are no user registrations recorded for ${periodLabel}.`}
              </p>
            </div>
          )}

          {/* User Table (Renders Skeletons while Loading) */}
          {(!error && (loading || filteredUsers.length > 0)) && (
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-neutral-50/95 sticky top-0 z-10 border-b border-neutral-200 text-[10.5px] font-bold font-admin uppercase tracking-wider text-neutral-500 select-none shadow-2xs">
                <tr>
                  <th className="py-2.5 px-5 w-[36%]">User Name</th>
                  <th className="py-2.5 px-5 w-[42%]">Email / Phone</th>
                  <th className="py-2.5 px-5 w-[22%] text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-sans text-neutral-800">
                {loading ? (
                  // Loading Skeleton Rows
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3 px-5">
                        <div className="h-3.5 w-28 bg-neutral-200 rounded" />
                      </td>
                      <td className="py-3 px-5 space-y-1.5">
                        <div className="h-3.5 w-36 bg-neutral-200 rounded" />
                        <div className="h-3 w-24 bg-neutral-100 rounded" />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="h-3.5 w-20 bg-neutral-200 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  paginatedUsers.map((u, idx) => {
                    const displayName = u.name || u.fullname || u.username || 'User';
                    const email = u.email || u.emailid || '';
                    
                    // Phone sanitization: render ONLY if valid phone exists
                    const rawPhone = u.phone || u.contactno;
                    const cleanPhone = (rawPhone && rawPhone !== 'null' && rawPhone !== 'undefined' && String(rawPhone).trim())
                      ? String(rawPhone).trim()
                      : null;

                    const joinedDate = formatDate(u.createdAt || u.createdate || u.member_since);

                    return (
                      <tr key={u.id || u.username || idx} className="hover:bg-neutral-50/80 transition-colors">
                        {/* USER NAME */}
                        <td className="py-3 px-5 font-medium text-neutral-900 font-admin truncate">
                          <span className="font-semibold text-neutral-900 truncate block">{displayName}</span>
                        </td>

                        {/* EMAIL / PHONE */}
                        <td className="py-3 px-5">
                          <div className="space-y-0.5 truncate">
                            <div className="text-neutral-800 font-sans text-xs truncate">
                              {email || 'N/A'}
                            </div>
                            {cleanPhone && (
                              <div className="text-neutral-500 text-[11px] font-sans truncate">
                                {cleanPhone}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* JOINED DATE */}
                        <td className="py-3 px-5 text-right text-neutral-600 font-sans text-xs whitespace-nowrap">
                          {joinedDate}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer: Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-center text-xs text-neutral-500 font-sans shrink-0">
            <div className="flex items-center gap-2">
              <span className="mr-2 text-neutral-600 text-[11px]">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 text-neutral-700" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RegisteredUsersModal;
