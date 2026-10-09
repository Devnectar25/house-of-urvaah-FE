import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  FolderTree,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { CategoryModal } from '../../components/admin/CategoryModal';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Category Add & Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Category Delete Confirmation Modal State
  const [deleteTargetCategory, setDeleteTargetCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toast helper
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Categories from Backend API
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient('/api/categories');
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response?.data && Array.isArray(response.data)) {
        list = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        list = response.data.data;
      }

      setCategories(list);
      setTotalCategories(list.length);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to load categories from server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Active Toggle Handler with Optimistic Update & Rollback
  const handleToggleActive = async (category) => {
    const id = category.category_id || category.id;
    if (togglingId === id) return;

    setTogglingId(id);
    const previousState = category.active !== undefined ? Boolean(category.active) : Boolean(category.is_active);
    const nextState = !previousState;

    // Optimistically update list in state
    setCategories((prev) =>
      prev.map((c) => {
        const catId = c.category_id || c.id;
        if (catId === id) {
          return { ...c, active: nextState, is_active: nextState };
        }
        return c;
      })
    );

    try {
      const endpoint = `/api/categories/${id}/${nextState ? 'activate' : 'deactivate'}`;
      await apiClient(endpoint, { method: 'PATCH' });

      showToast(
        'success',
        `Category "${category.name}" ${nextState ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err) {
      // Rollback on failure
      setCategories((prev) =>
        prev.map((c) => {
          const catId = c.category_id || c.id;
          if (catId === id) {
            return { ...c, active: previousState, is_active: previousState };
          }
          return c;
        })
      );
      showToast('error', `Failed to update status: ${err.message || 'Server error'}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Open Add Category Modal
  const handleOpenAddModal = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  // Open Edit Category Modal
  const handleOpenEditModal = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  // On Add / Edit Category Saved Success
  const handleCategorySaved = (savedCat, actionType) => {
    showToast(
      'success',
      `Category "${savedCat.name || 'item'}" ${actionType === 'created' ? 'created' : 'updated'} successfully!`
    );
    fetchCategories();
  };

  // Confirm Delete Category Handler
  const handleConfirmDelete = async () => {
    if (!deleteTargetCategory) return;
    const id = deleteTargetCategory.category_id || deleteTargetCategory.id;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiClient(`/api/categories/${id}`, {
        method: 'DELETE'
      });

      showToast('success', `Category "${deleteTargetCategory.name}" deleted successfully.`);
      setDeleteTargetCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setDeleteError(err.message || 'Failed to delete category. Products may still be assigned to it.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter categories by debounced search
  const filteredCategories = categories.filter((cat) => {
    if (!debouncedSearch.trim()) return true;
    const query = debouncedSearch.toLowerCase().trim();
    const nameMatch = (cat.name || '').toLowerCase().includes(query);
    const descMatch = (cat.description || '').toLowerCase().includes(query);
    return nameMatch || descMatch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-xs font-admin border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-brand-dark text-white border-neutral-800'
              : 'bg-brand-dark text-rose-100 border-rose-950'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span className="font-admin tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <CategoryModal
        category={selectedCategory}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCategorySaved={handleCategorySaved}
      />

      {/* Delete Category Confirmation Dialog */}
      {deleteTargetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200 font-admin">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-admin font-bold text-brand-dark">
                Delete Category
              </h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-brand-dark">"{deleteTargetCategory.name}"</span>? This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetCategory(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header Banner */}
      <AdminPageHeader
        title="Category Management"
        subtitle="Manage your product collections, catalog taxonomies, and featured status."
        actions={
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 active:bg-black text-white rounded-xl text-xs sm:text-sm font-semibold tracking-tight shadow-sm transition-all duration-200 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Add Category</span>
          </button>
        }
      />

      {/* Search & Filter Row */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-brand-dark cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Refresh List Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="p-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh category list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Table Subheader Count */}
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/50">
          <h2 className="text-base font-semibold tracking-wider text-brand-dark uppercase flex items-center gap-2">
            <span>Categories List</span>
            <span className="px-2.5 py-0.5 bg-neutral-200/80 rounded-full text-neutral-800 text-xs font-semibold">
              {totalCategories}
            </span>
          </h2>
          {debouncedSearch ? (
            <span className="text-[11px] text-neutral-500">
              Filtered view
            </span>
          ) : null}
        </div>

        {/* Error Banner State */}
        {error && !loading && (
          <div className="p-6 bg-rose-50/70 border-b border-rose-200 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-rose-900 mb-1">Failed to Load Categories</h4>
            <p className="text-xs text-rose-700 mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Request
            </button>
          </div>
        )}

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-neutral-50/80 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80">
                <th className="py-3 px-4 w-16">Image</th>
                <th className="py-3 px-4 w-1/4">Name</th>
                <th className="py-3 px-4 max-w-sm w-1/3">Description</th>
                <th className="py-3 px-4 text-center w-28">Active</th>
                <th className="py-3 px-4 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 text-xs text-brand-dark">
              {/* Skeleton Loader State */}
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="w-12 h-12 bg-neutral-200 rounded-lg" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-36" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-64" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-6 w-11 bg-neutral-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-8 w-16 bg-neutral-200 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 && !error ? (
                /* Empty State */
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <FolderTree className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-brand-dark mb-1">
                      {debouncedSearch ? 'No categories match your search' : 'No categories yet — add your first one'}
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-4">
                      {debouncedSearch
                        ? 'Try clearing or changing your search term to find a category.'
                        : 'Get started by creating your first product category for House of Urvaah.'}
                    </p>
                    {debouncedSearch ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center text-xs font-semibold text-brand-dark bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Search
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-brand-dark hover:bg-neutral-800 px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>+ Add Category</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                /* Categories List Rows */
                filteredCategories.map((cat) => {
                  const catId = cat.category_id || cat.id;
                  const isActive = cat.active !== undefined ? Boolean(cat.active) : Boolean(cat.is_active);
                  const rawImageUrl = cat.category_image || cat.image_url || cat.image;
                  const imageUrl = rawImageUrl ? getSupabaseMediaUrl(rawImageUrl) : '';

                  return (
                    <tr
                      key={catId}
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded-lg border border-neutral-200/80 bg-neutral-50 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                if (rawImageUrl && rawImageUrl !== imageUrl) {
                                  e.target.src = rawImageUrl;
                                } else {
                                  e.target.src = '/assets/Images/Corset01.png';
                                }
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-neutral-300" />
                          )}
                        </div>
                      </td>

                      {/* Category Name */}
                      <td className="py-3 px-4 font-admin font-bold text-xs text-brand-dark tracking-wide">
                        {cat.name}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-neutral-600 max-w-sm">
                        {cat.description ? (
                          <span
                            className="block max-w-sm truncate"
                            title={cat.description}
                          >
                            {cat.description}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">No description</span>
                        )}
                      </td>

                      {/* Active Status Toggle Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          disabled={togglingId === catId}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                            isActive ? 'bg-brand-dark' : 'bg-neutral-200'
                          } ${togglingId === catId ? 'opacity-60 cursor-wait' : ''}`}
                          title={isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform flex items-center justify-center shadow-xs ${
                              isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          >
                            {togglingId === catId && (
                              <Loader2 className="w-2.5 h-2.5 text-brand-dark animate-spin" />
                            )}
                          </span>
                        </button>
                      </td>

                      {/* Actions (Edit pencil & Delete trash) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-6">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 text-neutral-500 hover:text-brand-dark hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetCategory(cat)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
  );
};
