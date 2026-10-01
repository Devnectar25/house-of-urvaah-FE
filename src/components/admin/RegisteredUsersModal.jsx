import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Users, RefreshCw, AlertCircle, Calendar, Mail, Phone, User } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// Helper to format date safely
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

export const RegisteredUsersModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real database registered users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try /api/admin/users endpoint
      const res = await apiClient('/api/admin/users').catch(() => null) ||
                  await apiClient('/api/users').catch(() => null);

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
  }, []);

  // Fetch data whenever modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSearchQuery('');
    }
  }, [isOpen, fetchUsers]);

  // Filtered users based on search input
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-admin">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-neutral-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-brand-dark border border-neutral-200 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-admin text-brand-dark tracking-tight">
                All Registered Users
              </h2>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">
                All registered customers from the House of Urvaah database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-xl text-neutral-500 hover:text-brand-dark hover:bg-neutral-200/60 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh registered users"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar: Search */}
        <div className="px-6 py-3 border-b border-neutral-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 font-sans self-end sm:self-center">
            Showing <strong className="text-brand-dark font-semibold">{filteredUsers.length}</strong> of{' '}
            <strong className="text-brand-dark font-semibold">{users.length}</strong> registered users
          </div>
        </div>

        {/* Modal Body / Table Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Loading State */}
          {loading && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium font-sans text-neutral-600">
                Loading registered users...
              </p>
            </div>
          )}

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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-dark text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Request</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredUsers.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold font-admin text-brand-dark uppercase tracking-wider mb-1">
                {searchQuery ? 'No matching users found' : 'No registered users found'}
              </h3>
              <p className="text-xs text-neutral-500 font-sans max-w-xs">
                {searchQuery
                  ? `No user records matched "${searchQuery}". Try searching with a different term.`
                  : 'There are currently no customer registrations in the database.'}
              </p>
            </div>
          )}

          {/* User Table */}
          {!loading && !error && filteredUsers.length > 0 && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50/95 sticky top-0 z-10 border-b border-neutral-200 text-[11px] font-bold font-admin uppercase tracking-wider text-neutral-600 select-none shadow-2xs">
                <tr>
                  <th className="py-3 px-6">User Name</th>
                  <th className="py-3 px-6">Email / Phone</th>
                  <th className="py-3 px-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-sans text-neutral-800">
                {filteredUsers.map((u, idx) => {
                  const displayName = u.name || u.fullname || u.username || 'N/A';
                  const email = u.email || u.emailid || '';
                  const phone = u.phone || u.contactno || '';
                  const joinedDate = formatDate(u.createdAt || u.createdate || u.member_since);

                  return (
                    <tr key={u.id || u.username || idx} className="hover:bg-neutral-50/80 transition-colors">
                      {/* USER NAME */}
                      <td className="py-3.5 px-6 font-medium text-brand-dark">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold block text-neutral-900">{displayName}</span>
                            {u.username && u.username !== displayName && (
                              <span className="text-[11px] text-neutral-400 font-normal block">@{u.username}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* EMAIL / PHONE */}
                      <td className="py-3.5 px-6">
                        <div className="space-y-0.5">
                          {email ? (
                            <div className="flex items-center gap-1.5 text-neutral-700">
                              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span>{email}</span>
                            </div>
                          ) : null}
                          {phone ? (
                            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                              <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span>{phone}</span>
                            </div>
                          ) : null}
                          {!email && !phone && <span className="text-neutral-400">N/A</span>}
                        </div>
                      </td>

                      {/* JOINED DATE */}
                      <td className="py-3.5 px-6 text-neutral-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{joinedDate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-between text-xs text-neutral-500 font-sans">
          <span>
            Database source of truth: <strong className="font-semibold text-neutral-800">public.users</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors cursor-pointer text-xs uppercase tracking-wider"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default RegisteredUsersModal;
