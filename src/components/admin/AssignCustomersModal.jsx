import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  UserCheck,
  UserMinus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Crown,
  Zap,
  Check,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import couponService from '../../services/couponService';

export const AssignCustomersModal = ({ isOpen, onClose, coupon, onAssignmentUpdated }) => {
  if (!isOpen || !coupon) return null;

  // ── State Declaration ───────────────────────────────────────────────────────
  const [targetingMode, setTargetingMode] = useState('all'); // 'all' | 'top' | 'active'
  const [usersData, setUsersData] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [revokingUser, setRevokingUser] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ── Helper: Date & Currency Formatters ──────────────────────────────────────
  const formatDateStr = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ── Fetch Customers & Existing Assignments ─────────────────────────────────
  const fetchTargetData = useCallback(async (mode) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current assignments for this coupon
      const assignmentsRes = await couponService.getCouponAssignments(coupon.id).catch(() => []);
      const assignmentList = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes?.data || []);
      setAssignedUsers(assignmentList.filter((a) => a.status === 'assigned'));

      // 2. Fetch users based on selected targeting mode
      let targetRes = [];
      if (mode === 'top') {
        targetRes = await couponService.getTopCustomers(50).catch(() => []);
      } else if (mode === 'active') {
        targetRes = await couponService.getActiveUsers(50).catch(() => []);
      } else {
        targetRes = await couponService.getAvailableTargetUsers(coupon.id).catch(() => []);
      }

      const list = Array.isArray(targetRes) ? targetRes : (targetRes?.data || []);
      setUsersData(list);
    } catch (err) {
      console.error(`Failed to load ${mode} customers:`, err);
      setError(err.message || `Failed to load customer list for ${mode} users.`);
    } finally {
      setLoading(false);
    }
  }, [coupon]);

  // Initial load and tab switch reload
  useEffect(() => {
    if (isOpen && coupon) {
      fetchTargetData(targetingMode);
    }
  }, [isOpen, coupon, targetingMode, fetchTargetData]);

  // Reset modal state on close/reopen
  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([]);
      setSearchQuery('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // ── Mode Switch Handler ────────────────────────────────────────────────────
  const handleModeChange = (mode) => {
    if (mode === targetingMode) return;
    setTargetingMode(mode);
    setSearchQuery('');
    setError(null);
    setSuccessMessage(null);
  };

  // ── Search Filtering ───────────────────────────────────────────────────────
  const assignedUserIdsSet = useMemo(() => {
    const set = new Set();
    assignedUsers.forEach((a) => {
      if (a.username) set.add(String(a.username));
      if (a.user_id) set.add(String(a.user_id));
    });
    return set;
  }, [assignedUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    return usersData.filter((u) => {
      if (!term) return true;
      const uname = String(u.username || u.name || u.fullname || u.id || '').toLowerCase();
      const email = String(u.email || u.emailid || '').toLowerCase();
      const phone = String(u.contactno || u.phone || '').toLowerCase();
      return uname.includes(term) || email.includes(term) || phone.includes(term);
    });
  }, [usersData, searchQuery]);

  // ── Select All / Deselect All Logic ────────────────────────────────────────
  const unassignedFilteredUsers = useMemo(() => {
    return filteredUsers.filter((u) => {
      const uid = String(u.username || u.id);
      return !assignedUserIdsSet.has(uid) && u.status !== 'assigned';
    });
  }, [filteredUsers, assignedUserIdsSet]);

  const allFilteredSelected = useMemo(() => {
    if (unassignedFilteredUsers.length === 0) return false;
    return unassignedFilteredUsers.every((u) => {
      const uid = String(u.username || u.id);
      return selectedUserIds.includes(uid);
    });
  }, [unassignedFilteredUsers, selectedUserIds]);

  const someFilteredSelected = useMemo(() => {
    if (allFilteredSelected || unassignedFilteredUsers.length === 0) return false;
    return unassignedFilteredUsers.some((u) => {
      const uid = String(u.username || u.id);
      return selectedUserIds.includes(uid);
    });
  }, [unassignedFilteredUsers, selectedUserIds, allFilteredSelected]);

  const handleSelectAllToggle = () => {
    const unassignedIds = unassignedFilteredUsers.map((u) => String(u.username || u.id));
    if (allFilteredSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !unassignedIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...unassignedIds])));
    }
  };

  const handleToggleSelectUser = (userIdStr) => {
    setSelectedUserIds((prev) =>
      prev.includes(userIdStr) ? prev.filter((id) => id !== userIdStr) : [...prev, userIdStr]
    );
  };

  // ── Assign Selected Action ─────────────────────────────────────────────────
  const handleAssignSelected = async () => {
    if (selectedUserIds.length === 0) return;
    setAssigning(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await couponService.assignCoupon(coupon.id, selectedUserIds);

      if (res?.success) {
        const assignedCount = res?.data?.assignedCount || selectedUserIds.length;
        setSuccessMessage(`Successfully assigned coupon ${coupon.code} to ${assignedCount} customer(s).`);
        
        const newTotalCount = assignedUsers.length + assignedCount;
        if (onAssignmentUpdated) {
          onAssignmentUpdated(coupon.id, newTotalCount);
        }
        
        setSelectedUserIds([]);
        await fetchTargetData(targetingMode);
      } else {
        throw new Error(res?.message || 'Assignment failed');
      }
    } catch (err) {
      console.error('Assign failed:', err);
      setError(err.message || 'Failed to assign coupon to selected customers.');
    } finally {
      setAssigning(false);
    }
  };

  // ── Revoke Assignment Action ───────────────────────────────────────────────
  const handleRevokeAssignment = async (userId) => {
    setRevokingUser(userId);
    setError(null);
    setSuccessMessage(null);

    try {
      await couponService.revokeAssignment(coupon.id, encodeURIComponent(userId));

      setSuccessMessage(`Revoked assignment for user "${userId}".`);
      const newCount = Math.max(0, assignedUsers.length - 1);
      if (onAssignmentUpdated) {
        onAssignmentUpdated(coupon.id, newCount);
      }
      await fetchTargetData(targetingMode);
    } catch (err) {
      console.error('Revoke failed:', err);
      setError(err.message || 'Failed to revoke customer assignment.');
    } finally {
      setRevokingUser(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-admin">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] border border-neutral-200">
        
        {/* ── Modal Header ──────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/90 shrink-0">

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-dark text-white shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <span>Assign Coupon:</span>
                <span className="font-mono bg-neutral-200/70 text-brand-dark px-2.5 py-0.5 rounded-lg text-sm tracking-wide font-bold">
                  {coupon.code}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 font-sans">
                Target specific user groups for this promotion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 p-6 space-y-5 no-scrollbar">
          
          {/* Status Banners */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs font-sans animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-xs font-sans animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{successMessage}</span>
            </div>
          )}

          {/* ── TARGETING MODE SELECTION CARDS ──────────────────────────────── */}
          <div className="space-y-2 font-sans">
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
              Targeting Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Option 1: All Users */}
              <button
                type="button"
                onClick={() => handleModeChange('all')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  targetingMode === 'all'
                    ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                    : 'bg-neutral-50 text-brand-dark border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${targetingMode === 'all' ? 'bg-white/10 text-white' : 'bg-neutral-200/70 text-brand-dark'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">All Users</div>
                  <div className={`text-[11px] mt-0.5 ${targetingMode === 'all' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    All customer accounts
                  </div>
                </div>
              </button>

              {/* Option 2: Top Customers */}
              <button
                type="button"
                onClick={() => handleModeChange('top')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  targetingMode === 'top'
                    ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                    : 'bg-neutral-50 text-brand-dark border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${targetingMode === 'top' ? 'bg-white/10 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Top Customers</div>
                  <div className={`text-[11px] mt-0.5 ${targetingMode === 'top' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Highest orders & revenue
                  </div>
                </div>
              </button>

              {/* Option 3: Active Users */}
              <button
                type="button"
                onClick={() => handleModeChange('active')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  targetingMode === 'active'
                    ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                    : 'bg-neutral-50 text-brand-dark border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${targetingMode === 'active' ? 'bg-white/10 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Active Users</div>
                  <div className={`text-[11px] mt-0.5 ${targetingMode === 'active' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Recently active shoppers
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* Currently Assigned Customers Pill Bar (if any) */}
          {assignedUsers.length > 0 && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Currently Assigned Customers ({assignedUsers.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto overflow-x-hidden no-scrollbar pt-0.5">
                {assignedUsers.map((u) => {
                  const uid = u.username || u.user_id;
                  return (
                    <span
                      key={uid}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-full text-xs font-semibold text-brand-dark shadow-2xs"
                    >
                      <span>{uid}</span>
                      {u.emailid && <span className="text-[10px] text-neutral-400 font-normal">({u.emailid})</span>}
                      <button
                        type="button"
                        disabled={revokingUser === uid}
                        onClick={() => handleRevokeAssignment(uid)}
                        className="ml-0.5 text-neutral-400 hover:text-rose-600 cursor-pointer transition-colors"
                        title="Revoke assignment"
                      >
                        {revokingUser === uid ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SEARCH INPUT ────────────────────────────────────────────────── */}
          <div className="relative font-sans">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all"
            />
          </div>

          {/* ── CUSTOMER TABLE ──────────────────────────────────────────────── */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="max-h-72 overflow-y-auto overflow-x-hidden no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-neutral-50/90 sticky top-0 z-10 border-b border-neutral-200 text-xs font-bold text-neutral-600 uppercase tracking-wider font-admin">
                  <tr>
                    <th className="py-3 px-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someFilteredSelected;
                        }}
                        disabled={unassignedFilteredUsers.length === 0}
                        onChange={handleSelectAllToggle}
                        className="rounded border-neutral-300 text-brand-dark focus:ring-brand-dark cursor-pointer disabled:opacity-40"
                      />
                    </th>
                    <th className="py-3 px-3 w-[28%]">User</th>
                    <th className="py-3 px-3 w-[30%]">Contact</th>

                    {/* Conditional Header Columns */}
                    {targetingMode !== 'all' && (
                      <th className="py-3 px-2.5 text-center w-[12%]">Orders</th>
                    )}
                    {targetingMode !== 'all' && (
                      <th className="py-3 px-2.5 text-right w-[16%]">Revenue</th>
                    )}
                    {targetingMode === 'all' && (
                      <th className="py-3 px-3 w-[28%]">Joined Date</th>
                    )}
                    {targetingMode === 'active' && (
                      <th className="py-3 px-3 w-[28%]">Last Active</th>
                    )}

                    <th className="py-3 px-3 text-right w-[14%]">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 text-xs font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                          <span className="text-xs font-medium">Loading customer data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-neutral-400 text-xs">
                        No users found matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const uIdStr = String(u.username || u.id);
                      const isAssigned = assignedUserIdsSet.has(uIdStr) || u.status === 'assigned';
                      const isSelected = selectedUserIds.includes(uIdStr);

                      const name = u.fullname || u.username || u.name || `User #${uIdStr}`;
                      const email = u.email || u.emailid || 'No email';
                      const phone = u.contactno || u.phone || 'No phone';

                      return (
                        <tr
                          key={uIdStr}
                          onClick={() => !isAssigned && handleToggleSelectUser(uIdStr)}
                          className={`transition-colors cursor-pointer ${
                            isAssigned
                              ? 'bg-neutral-50/60 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-neutral-100/70 font-medium'
                              : 'hover:bg-neutral-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2.5 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              disabled={isAssigned}
                              checked={isAssigned || isSelected}
                              onChange={() => handleToggleSelectUser(uIdStr)}
                              className="rounded border-neutral-300 text-brand-dark focus:ring-brand-dark cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* User Info */}
                          <td className="py-2.5 px-3 min-w-0">
                            <div className="font-semibold text-brand-dark truncate" title={name}>{name}</div>
                            <div className="text-[11px] text-neutral-500 font-mono truncate">{uIdStr}</div>
                          </td>

                          {/* Contact */}
                          <td className="py-2.5 px-3 text-neutral-600 min-w-0">
                            <div className="truncate" title={email}>{email}</div>
                            {phone !== 'No phone' && (
                              <div className="text-[11px] text-neutral-400 truncate">{phone}</div>
                            )}
                          </td>

                          {/* Orders Column (Top/Active mode) */}
                          {targetingMode !== 'all' && (
                            <td className="py-2.5 px-2.5 text-center font-semibold text-brand-dark whitespace-nowrap">
                              {u.total_orders ?? u.orders ?? u.order_count ?? 0}
                            </td>
                          )}

                          {/* Revenue Column (Top/Active mode) */}
                          {targetingMode !== 'all' && (
                            <td className="py-2.5 px-2.5 text-right font-semibold text-brand-dark font-mono whitespace-nowrap">
                              {formatCurrency(u.total_revenue ?? u.revenue ?? 0)}
                            </td>
                          )}

                          {/* Joined Date (All mode) */}
                          {targetingMode === 'all' && (
                            <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                              {formatDateStr(u.created_at || u.createdate)}
                            </td>
                          )}

                          {/* Last Active Date (Active mode) */}
                          {targetingMode === 'active' && (
                            <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                              {formatDateStr(u.last_active || u.created_at)}
                            </td>
                          )}

                          {/* Status Badge */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Assigned
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-dark bg-brand-sand px-2 py-0.5 rounded-full border border-neutral-300">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400">Unassigned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── Modal Footer ───────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/90 shrink-0 flex items-center justify-between font-admin">
          <span className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
            {selectedUserIds.length} user{selectedUserIds.length === 1 ? '' : 's'} selected
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={assigning}
              className="px-5 py-2.5 h-10 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 hover:text-neutral-950 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAssignSelected}
              disabled={assigning || selectedUserIds.length === 0}
              className="px-6 py-2.5 h-10 bg-neutral-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Assign Selected</span>
              )}
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default AssignCustomersModal;
