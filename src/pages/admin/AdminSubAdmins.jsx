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
  UserCheck
} from 'lucide-react';
import {
  fetchSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin
} from '../../services/subAdminService';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

// Available permission modules in House of Urvaah Admin Panel
const PERMISSION_OPTIONS = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'categories', label: 'Categories' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'refunds', label: 'Refund Desk' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'customers', label: 'Customers' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'settings', label: 'Settings' }
];

export const AdminSubAdmins = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    permissions: []
  });

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

  // Open Modal for Create or Edit
  const openModal = (subAdmin = null) => {
    setModalError(null);
    if (subAdmin) {
      setEditingSubAdmin(subAdmin);
      setFormData({
        username: subAdmin.username || '',
        password: '',
        permissions: Array.isArray(subAdmin.permissions) ? [...subAdmin.permissions] : []
      });
    } else {
      setEditingSubAdmin(null);
      setFormData({
        username: '',
        password: '',
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingSubAdmin(null);
    setFormData({ username: '', password: '', permissions: [] });
    setModalError(null);
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
  };

  // Submit Add / Edit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.username.trim()) {
      setModalError('Username is required.');
      return;
    }

    if (!editingSubAdmin && !formData.password.trim()) {
      setModalError('Password is required for new sub-admin.');
      return;
    }

    if (formData.permissions.length === 0) {
      setModalError('Please select at least one permission module.');
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
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await updateSubAdmin(editingSubAdmin.id, payload);
        showToast(`Sub-admin "${formData.username.trim()}" updated successfully!`);
      } else {
        // Create new sub-admin
        const payload = {
          username: formData.username.trim(),
          password: formData.password.trim(),
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-neutral-800 active:bg-black text-white rounded-xl text-sm font-bold tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
            >
              <UserPlus className="w-4.5 h-4.5 stroke-[2.2]" />
              <span>Add Sub-Admin</span>
            </button>
          </>
        }
      />

      {/* Main Sub-Admins Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        {/* Card Header + Search */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight font-admin flex items-center gap-2">
            All Sub-Admins
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-semibold">
              {filteredSubAdmins.length}
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
                {filteredSubAdmins.map((subAdmin) => (
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
                              className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200/80 font-admin capitalize"
                            >
                              {perm}
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
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 font-sans">
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
                    required
                    placeholder="Enter username or email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-admin font-semibold"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin mb-1.5">
                    Password {editingSubAdmin ? '(leave blank to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                    />
                    <Lock className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Permissions Radio/Checkbox Options */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin mb-2">
                    Permissions *
                  </label>
                  <div className="space-y-2">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isSelected = formData.permissions.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => togglePermission(opt.id)}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-neutral-100 border-neutral-900 text-neutral-950 font-semibold shadow-2xs'
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
