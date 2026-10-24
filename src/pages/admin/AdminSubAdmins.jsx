import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Pencil,
  Trash2,
  X,
  Check,
  Shield,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
  Lock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Circle
} from 'lucide-react';
import {
  fetchSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin
} from '../../services/subAdminService';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  PERMISSION_GROUPS,
  PERMISSION_IDS,
  PASSWORD_RULES,
  getPermissionLabel,
  validateUsername,
  validatePassword,
  validatePermissions,
  MAX_SUB_ADMINS
} from '../../constants/adminPermissions';

const EMPTY_FORM = { username: '', password: '', confirmPassword: '', permissions: [] };

// Legacy ids saved before the permission list was unified
const normalizePermissions = (perms) =>
  Array.from(new Set(
    (Array.isArray(perms) ? perms : [])
      .map((p) => (p === 'refund-desk' ? 'refunds' : p))
      .filter((p) => PERMISSION_IDS.includes(p))
  ));

export const AdminSubAdmins = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Action Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Sub-Admins
  const loadSubAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubAdmins();
      setSubAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminSubAdmins] Fetch Error:', err);
      setError(err.message || 'Failed to load sub-admin accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubAdmins();
  }, [loadSubAdmins]);

  const isAtSubAdminLimit = subAdmins.length >= MAX_SUB_ADMINS;
  const subAdminLimitMessage = `Sub-admin limit reached (${MAX_SUB_ADMINS}/${MAX_SUB_ADMINS}). Delete an existing sub-admin to add a new one.`;

  // Open Modal for Create or Edit
  const openModal = (subAdmin = null) => {
    if (!subAdmin && isAtSubAdminLimit) {
      showToast(subAdminLimitMessage, 'error');
      return;
    }
    setModalError(null);
    setFieldErrors({});
    setShowPassword(false);
    if (subAdmin) {
      setEditingSubAdmin(subAdmin);
      setFormData({
        ...EMPTY_FORM,
        username: subAdmin.username || '',
        permissions: normalizePermissions(subAdmin.permissions)
      });
    } else {
      setEditingSubAdmin(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingSubAdmin(null);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
    setModalError(null);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as the admin edits it
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Handle permission checkbox/toggle select
  const togglePermission = (permId) => {
    setFormData((prev) => {
      const current = prev.permissions;
      if (current.includes(permId)) {
        return { ...prev, permissions: current.filter((p) => p !== permId) };
      } else {
        return { ...prev, permissions: [...current, permId] };
      }
    });
    if (fieldErrors.permissions) setFieldErrors((prev) => ({ ...prev, permissions: null }));
  };

  const setAllPermissions = (selectAll) => {
    setFormData((prev) => ({ ...prev, permissions: selectAll ? [...PERMISSION_IDS] : [] }));
    if (selectAll && fieldErrors.permissions) setFieldErrors((prev) => ({ ...prev, permissions: null }));
  };

  // Validate every field; returns true when the form can be submitted
  const validateForm = () => {
    const otherUsernames = subAdmins
      .filter((sa) => !editingSubAdmin || sa.id !== editingSubAdmin.id)
      .map((sa) => sa.username);

    const errors = {};
    errors.username = validateUsername(formData.username, otherUsernames);

    const isPasswordRequired = !editingSubAdmin || formData.password.length > 0 || formData.confirmPassword.length > 0;
    if (isPasswordRequired) {
      errors.password = validatePassword(formData.password, formData.username);
      if (!errors.password && formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    errors.permissions = validatePermissions(formData.permissions);

    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  };

  // Submit Add / Edit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!validateForm()) {
      setModalError('Please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubAdmin) {
        // Update existing sub-admin
        const payload = {
          username: formData.username.trim(),
          permissions: formData.permissions
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await updateSubAdmin(editingSubAdmin.id, payload);
        showToast(`Sub-admin "${formData.username.trim()}" updated successfully!`);
      } else {
        // Create new sub-admin
        const payload = {
          username: formData.username.trim(),
          password: formData.password,
          permissions: formData.permissions
        };
        await createSubAdmin(payload);
        showToast(`Sub-admin "${formData.username.trim()}" created successfully!`);
      }
      closeModal();
      loadSubAdmins();
    } catch (err) {
      console.error('[AdminSubAdmins] Submit Error:', err);
      setModalError(err.message || 'Failed to save sub-admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status directly from table switch
  const handleToggleActive = async (subAdmin) => {
    setTogglingId(subAdmin.id);
    try {
      const newStatus = !subAdmin.active;
      await updateSubAdmin(subAdmin.id, { active: newStatus });
      setSubAdmins((prev) =>
        prev.map((item) => (item.id === subAdmin.id ? { ...item, active: newStatus } : item))
      );
      showToast(
        `Sub-admin "${subAdmin.username}" ${newStatus ? 'activated' : 'deactivated'}.`
      );
    } catch (err) {
      console.error('[AdminSubAdmins] Toggle Active Error:', err);
      showToast(err.message || 'Failed to change active status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm and handle deletion
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSubAdmin(deleteTarget.id);
      showToast(`Sub-admin "${deleteTarget.username}" deleted successfully.`);
      setDeleteTarget(null);
      loadSubAdmins();
    } catch (err) {
      console.error('[AdminSubAdmins] Delete Error:', err);
      showToast(err.message || 'Failed to delete sub-admin', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter sub-admins based on search input
  const filteredSubAdmins = subAdmins.filter((sa) =>
    (sa.username || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, limit]);

  const totalFiltered = filteredSubAdmins.length;
  const totalPages = Math.ceil(totalFiltered / limit) || 1;
  const paginatedSubAdmins = filteredSubAdmins.slice((currentPage - 1) * limit, currentPage * limit);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 font-admin text-brand-dark pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-lg border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Page Header Banner */}
      <AdminPageHeader
        title="Sub-Admin Management"
        icon={UserCheck}
        subtitle="Manage sub-admins and their permissions"
        actions={
          <>
            <button
              type="button"
              onClick={loadSubAdmins}
              disabled={loading}
              className="p-2.5 rounded-xl border border-[#E5E0D5] bg-white hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh Sub-Admin Accounts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => openModal()}
              disabled={loading || isAtSubAdminLimit}
              title={isAtSubAdminLimit ? subAdminLimitMessage : `Add a sub-admin (${subAdmins.length}/${MAX_SUB_ADMINS} used)`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-neutral-800 active:bg-black text-white rounded-xl text-sm font-bold tracking-tight shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#111111]"
            >
              <UserPlus className="w-4.5 h-4.5 stroke-[2.2]" />
              <span>Add Sub-Admin</span>
            </button>
          </>
        }
      />

      {/* Sub-admin limit notice */}
      {!loading && isAtSubAdminLimit && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{subAdminLimitMessage}</span>
        </div>
      )}

      {/* Main Sub-Admins Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        {/* Card Header + Search */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight font-admin flex items-center gap-2">
            All Sub-Admins
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-semibold">
              {filteredSubAdmins.length}
            </span>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                isAtSubAdminLimit
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-white text-neutral-500 border-neutral-200'
              }`}
              title={`Maximum ${MAX_SUB_ADMINS} sub-admins`}
            >
              {subAdmins.length} / {MAX_SUB_ADMINS} used
            </span>
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-sans"
            />
          </div>
        </div>

        {/* Table Container */}
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
            <p className="text-xs uppercase tracking-widest font-bold text-neutral-500 font-admin">
              Loading Sub-Admins...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50/50 m-6 rounded-2xl border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-900 font-admin">{error}</p>
            <button
              onClick={loadSubAdmins}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredSubAdmins.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-base font-bold text-neutral-900 font-admin">No Sub-Admins Found</p>
            <p className="text-xs text-neutral-500 font-sans mt-1 max-w-sm">
              {searchQuery
                ? `No sub-admins match "${searchQuery}".`
                : 'Click "+ Add Sub-Admin" to create your first sub-admin user with assigned permissions.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60 text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-admin">
                  <th className="py-3.5 px-6">Username</th>
                  <th className="py-3.5 px-6">Permissions</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm font-sans">
                {paginatedSubAdmins.map((subAdmin) => (
                  <tr key={subAdmin.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Username Column */}
                    <td className="py-4 px-6 font-semibold text-neutral-950 font-admin">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {subAdmin.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[200px]">{subAdmin.username}</span>
                      </div>
                    </td>

                    {/* Permissions Badges Column */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {Array.isArray(subAdmin.permissions) && subAdmin.permissions.length > 0 ? (
                          subAdmin.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200/80 font-admin"
                            >
                              {getPermissionLabel(perm)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400 italic">No permissions</span>
                        )}
                      </div>
                    </td>

                    {/* Active Status Toggle + Pill */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(subAdmin)}
                          disabled={togglingId === subAdmin.id}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black/10 ${
                            subAdmin.active ? 'bg-black' : 'bg-neutral-200'
                          }`}
                          title={`Click to ${subAdmin.active ? 'deactivate' : 'activate'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              subAdmin.active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-admin ${
                            subAdmin.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}
                        >
                          {subAdmin.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>

                    {/* Created Date Column */}
                    <td className="py-4 px-6 text-xs font-medium text-neutral-500 font-admin">
                      {formatDate(subAdmin.createdate)}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(subAdmin)}
                          className="p-2 rounded-xl text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
                          title="Edit Sub-Admin"
                        >
                          <Pencil className="w-4 h-4 stroke-[2]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(subAdmin)}
                          className="p-2 rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          title="Delete Sub-Admin"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer Controls */}
        {!loading && totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200/80 px-6 py-3.5 bg-neutral-50/50 gap-3">
            <div className="flex items-center gap-3 text-xs text-neutral-500 font-sans">
              <span>
                Showing <span className="font-semibold text-neutral-800">{(currentPage - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-neutral-800">
                  {Math.min(currentPage * limit, totalFiltered)}
                </span>{' '}
                of <span className="font-semibold text-neutral-800">{totalFiltered}</span> sub-admins
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
      {/* ADD / EDIT SUB-ADMIN MODAL                                                */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn font-admin"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200 font-admin">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80 shrink-0">
              <h3 className="text-xl font-bold text-neutral-950 tracking-tight font-admin">
                {editingSubAdmin ? 'Edit Sub-Admin' : 'Add Sub-Admin'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1.5 text-neutral-400 hover:text-neutral-950 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 font-sans">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Error message inside modal */}
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Username Field */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin mb-1.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    maxLength={50}
                    placeholder="e.g. priya.ops or priya@houseofurvaah.com"
                    value={formData.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    onBlur={() => {
                      const others = subAdmins.filter((sa) => !editingSubAdmin || sa.id !== editingSubAdmin.id).map((sa) => sa.username);
                      setFieldErrors((prev) => ({ ...prev, username: validateUsername(formData.username, others) }));
                    }}
                    aria-invalid={Boolean(fieldErrors.username)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-admin font-semibold ${
                      fieldErrors.username ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-black'
                    }`}
                  />
                  {fieldErrors.username ? (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.username}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-neutral-400">3–50 characters: letters, numbers, . _ - @ (no spaces).</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin mb-1.5">
                    Password {editingSubAdmin ? '(leave blank to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      maxLength={64}
                      placeholder={editingSubAdmin ? 'Enter a new password to change it' : 'Create a strong password'}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      aria-invalid={Boolean(fieldErrors.password)}
                      className={`w-full pl-4 pr-10 py-2.5 bg-neutral-50/80 border rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all ${
                        fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-black'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.password}</p>
                  )}

                  {/* Live password requirement checklist */}
                  {(!editingSubAdmin || formData.password.length > 0) && (
                    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(formData.password);
                        return (
                          <li key={rule.id} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-700' : 'text-neutral-400'}`}>
                            {ok ? <Check className="w-3 h-3 stroke-[3]" /> : <Circle className="w-3 h-3" />}
                            <span>{rule.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Confirm Password Field */}
                {(!editingSubAdmin || formData.password.length > 0) && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        maxLength={64}
                        placeholder="Re-enter the password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        className={`w-full pl-4 pr-10 py-2.5 bg-neutral-50/80 border rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all ${
                          fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-black'
                        }`}
                      />
                      <Lock className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {fieldErrors.confirmPassword ? (
                      <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.confirmPassword}</p>
                    ) : formData.confirmPassword && formData.confirmPassword === formData.password ? (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-700">Passwords match.</p>
                    ) : null}
                  </div>
                )}

                {/* Permissions (grouped) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin">
                      Permissions * <span className="text-neutral-400 normal-case font-semibold">({formData.permissions.length} selected)</span>
                    </label>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <button type="button" onClick={() => setAllPermissions(true)} className="text-neutral-700 hover:text-black underline-offset-2 hover:underline cursor-pointer">
                        Select all
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button type="button" onClick={() => setAllPermissions(false)} className="text-neutral-500 hover:text-red-600 underline-offset-2 hover:underline cursor-pointer">
                        Clear
                      </button>
                    </div>
                  </div>
                  {fieldErrors.permissions && (
                    <p className="mb-2 text-[11px] font-semibold text-red-600">{fieldErrors.permissions}</p>
                  )}
                  <div className="space-y-3">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.group}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">{group.group}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.options.map((opt) => {
                            const isSelected = formData.permissions.includes(opt.id);
                            return (
                              <div
                                key={opt.id}
                                role="checkbox"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onClick={() => togglePermission(opt.id)}
                                onKeyDown={(e) => {
                                  if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    togglePermission(opt.id);
                                  }
                                }}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? 'bg-neutral-100 border-neutral-900 text-neutral-950 font-semibold shadow-2xs'
                                    : fieldErrors.permissions
                                    ? 'bg-white border-red-200 text-neutral-700 hover:bg-neutral-50'
                                    : 'bg-white border-neutral-200/80 text-neutral-700 hover:bg-neutral-50'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? 'bg-black border-black text-white'
                                      : 'border-neutral-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <span className="text-sm font-semibold font-admin">{opt.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/80 shrink-0 flex items-center justify-end gap-3 font-admin">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 h-10 border border-neutral-300 text-neutral-700 hover:text-neutral-950 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#111111] hover:bg-neutral-800 active:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingSubAdmin ? 'Update' : 'Save'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn font-admin"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl border border-neutral-200 relative animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-200">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <h3 className="text-xl font-admin font-bold text-neutral-950 tracking-tight mb-2 uppercase">
              Delete Sub-Admin
            </h3>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed mb-6">
              Are you sure you want to delete sub-admin account{' '}
              <strong className="text-neutral-950 font-bold">"{deleteTarget.username}"</strong>?
              This action cannot be undone and will revoke all assigned access permissions.
            </p>

            <div className="flex items-center justify-end gap-3 font-admin">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 h-10 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubAdmins;
