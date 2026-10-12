import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Layers,
  X,
  Loader2,
  Filter,
  Check
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

const DEFAULT_CATEGORIES = [
  'Orders & Shipping',
  'Sizing & Fit',
  'Returns & Exchanges',
  'Atelier & Craftsmanship',
  'Payments & Security',
  'General'
];

export const AdminFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    question: '',
    answer: '',
    category: 'Orders & Shipping',
    customCategory: '',
    display_order: 1,
    is_active: true
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle Action Loading ID
  const [togglingId, setTogglingId] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch FAQs from API
  const fetchFaqs = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await apiClient('/api/faqs/admin');
      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setFaqs(list);

        // Merge discovered categories with defaults
        if (Array.isArray(res.categories) && res.categories.length > 0) {
          const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...res.categories]));
          setCategories(combined);
        }
      } else {
        throw new Error(res?.message || res?.error || 'Failed to fetch FAQs');
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError(err.message || 'Unable to connect to the FAQ server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs(false);
  }, [fetchFaqs]);

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingFaq(null);
    setModalFormData({
      question: '',
      answer: '',
      category: categories[0] || 'Orders & Shipping',
      customCategory: '',
      display_order: (faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order || 0)) + 1 : 1),
      is_active: true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (faq) => {
    setEditingFaq(faq);
    const isStandardCategory = categories.includes(faq.category);
    setModalFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      category: isStandardCategory ? faq.category : 'CUSTOM',
      customCategory: isStandardCategory ? '' : (faq.category || ''),
      display_order: faq.display_order ?? 1,
      is_active: faq.is_active ?? true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Modal Submit (Create or Update)
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const questionTrim = modalFormData.question.trim();
    const answerTrim = modalFormData.answer.trim();
    let finalCategory = modalFormData.category;

    if (modalFormData.category === 'CUSTOM') {
      finalCategory = modalFormData.customCategory.trim();
      if (!finalCategory) {
        setModalError('Please specify a custom category name');
        return;
      }
    }

    if (!questionTrim) {
      setModalError('Please enter a question');
      return;
    }
    if (!answerTrim) {
      setModalError('Please provide an answer');
      return;
    }

    const payload = {
      question: questionTrim,
      answer: answerTrim,
      category: finalCategory,
      display_order: Number(modalFormData.display_order) || 0,
      is_active: Boolean(modalFormData.is_active)
    };

    setModalSubmitting(true);
    try {
      if (editingFaq) {
        // UPDATE existing FAQ
        const res = await apiClient(`/api/faqs/${editingFaq.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res?.success) {
          showToast('success', 'FAQ updated successfully');
          setIsModalOpen(false);
          await fetchFaqs(true);
        } else {
          throw new Error(res?.message || res?.error || 'Failed to update FAQ');
        }
      } else {
        // CREATE new FAQ
        const res = await apiClient('/api/faqs', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res?.success) {
          showToast('success', 'New FAQ added successfully');
          setIsModalOpen(false);
          await fetchFaqs(true);
        } else {
          throw new Error(res?.message || res?.error || 'Failed to create FAQ');
        }
      }
    } catch (err) {
      console.error('Save FAQ Error:', err);
      setModalError(err.message || 'Error saving FAQ. Please try again.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Fast Toggle Active / Inactive
  const handleToggleStatus = async (faq) => {
    if (togglingId === faq.id) return;
    setTogglingId(faq.id);

    const nextState = !faq.is_active;

    // Optimistic Update
    setFaqs(prev =>
      prev.map(item => (item.id === faq.id ? { ...item, is_active: nextState } : item))
    );

    try {
      const res = await apiClient(`/api/faqs/${faq.id}/toggle`, {
        method: 'PATCH'
      });

      if (!res?.success) {
        throw new Error(res?.message || 'Toggle failed');
      }
      showToast('success', `FAQ is now ${nextState ? 'Active & visible' : 'Hidden from storefront'}`);
    } catch (err) {
      // Revert optimistic update
      setFaqs(prev =>
        prev.map(item => (item.id === faq.id ? { ...item, is_active: !nextState } : item))
      );
      showToast('error', `Failed to update status: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete FAQ
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await apiClient(`/api/faqs/${deleteTarget.id}`, {
        method: 'DELETE'
      });

      if (res?.success) {
        setFaqs(prev => prev.filter(f => f.id !== deleteTarget.id));
        showToast('success', 'FAQ deleted permanently');
        setDeleteTarget(null);
      } else {
        throw new Error(res?.message || 'Failed to delete FAQ');
      }
    } catch (err) {
      showToast('error', `Delete error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search Logic
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch =
      !searchQuery.trim() ||
      faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || faq.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && faq.is_active) ||
      (statusFilter === 'inactive' && !faq.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Metrics
  const totalCount = faqs.length;
  const activeCount = faqs.filter(f => f.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const categoryCount = new Set(faqs.map(f => f.category)).size;

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-neutral-900 text-white border-neutral-700'
              : 'bg-rose-950 text-rose-100 border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Header */}
      <AdminPageHeader
        title="FAQ Management"
        subtitle="Manage frequently asked questions displayed on the storefront Contact Us concierge page and referenced by the Urvaah Bot."
        icon={HelpCircle}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 text-white uppercase tracking-wider">
            Customer Support Center
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchFaqs(true)}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E0D5] text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh FAQ data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-neutral-900' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111111] text-white hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New FAQ</span>
            </button>
          </div>
        }
      />

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">Total FAQs</span>
            <HelpCircle className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">{totalCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Total questions stored in database</p>
        </div>

        <div className="bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">Live & Active</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">{activeCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Visible on Contact Us page</p>
        </div>

        <div className="bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">Hidden / Draft</span>
            <EyeOff className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-neutral-600">{inactiveCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Inactive & unpublished</p>
        </div>

        <div className="bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">Categories</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">{categoryCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Distinct support sections</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by question, answer, or keyword..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#FAF8F3] border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Filter */}
          <div className="flex items-center gap-1 bg-[#FAF8F3] border border-neutral-200 p-1 rounded-xl self-start md:self-center">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-neutral-700 font-semibold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Hidden ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-neutral-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                : 'bg-[#FAF8F3] text-neutral-600 border-[#E5E0D5] hover:bg-neutral-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const countInCat = faqs.filter(f => f.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                    : 'bg-[#FAF8F3] text-neutral-600 border-[#E5E0D5] hover:bg-neutral-100'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {countInCat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main FAQ Content Table / Cards */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="w-7 h-7 animate-spin text-neutral-800" />
            <p className="text-xs uppercase tracking-widest font-serif">Loading FAQs from Database...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-900 mb-1">Failed to Load FAQs</h3>
            <p className="text-xs text-neutral-600 max-w-md mx-auto mb-4">{error}</p>
            <button
              onClick={() => fetchFaqs(false)}
              className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <div className="w-14 h-14 bg-[#FAF8F3] border border-[#E5E0D5] rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-800 mb-1">
              No FAQs Found
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-5">
              {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find what you are looking for.'
                : 'Get started by creating the first frequently asked question for House of Urvaah.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 shadow-2xs"
            >
              <Plus className="w-4 h-4" /> Add First FAQ
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-[11px] font-serif uppercase tracking-wider text-neutral-600">
                  <th className="py-3.5 px-4 sm:px-6 w-16">Order</th>
                  <th className="py-3.5 px-4 sm:px-6">Question & Answer</th>
                  <th className="py-3.5 px-4 sm:px-6 w-44">Category</th>
                  <th className="py-3.5 px-4 sm:px-6 w-32 text-center">Live Status</th>
                  <th className="py-3.5 px-4 sm:px-6 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5]/70 text-xs text-neutral-800">
                {filteredFaqs.map((faq) => (
                  <tr
                    key={faq.id}
                    className="hover:bg-[#FAF8F3]/60 transition-colors group"
                  >
                    {/* Display Order */}
                    <td className="py-4 px-4 sm:px-6 align-top">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200/80 text-xs font-mono font-semibold text-neutral-700">
                        {faq.display_order ?? 0}
                      </span>
                    </td>

                    {/* Question & Answer Details */}
                    <td className="py-4 px-4 sm:px-6 align-top max-w-xl">
                      <div className="space-y-1.5">
                        <h4 className="font-serif font-bold text-sm text-neutral-950 tracking-wide group-hover:text-black">
                          {faq.question}
                        </h4>
                        <p className="text-neutral-600 text-xs leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
                          {faq.answer}
                        </p>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-4 px-4 sm:px-6 align-top">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 border border-neutral-200 text-neutral-800 tracking-wide">
                        {faq.category || 'General'}
                      </span>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-4 px-4 sm:px-6 align-top text-center">
                      <button
                        onClick={() => handleToggleStatus(faq)}
                        disabled={togglingId === faq.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          faq.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                        } disabled:opacity-50`}
                        title="Click to toggle active status on storefront"
                      >
                        {togglingId === faq.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : faq.is_active ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                        )}
                        <span>{faq.is_active ? 'Active' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* Actions: Edit & Delete with Name Labels */}
                    <td className="py-4 px-4 sm:px-6 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(faq)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all cursor-pointer shadow-2xs no-underline hover:no-underline"
                          style={{ textDecoration: 'none' }}
                          title="Edit FAQ"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="no-underline" style={{ textDecoration: 'none' }}>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(faq)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer shadow-2xs no-underline hover:no-underline"
                          style={{ textDecoration: 'none' }}
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="no-underline" style={{ textDecoration: 'none' }}>Delete</span>
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

      {/* Add / Edit FAQ Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-300 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#FAF8F3] border-b border-[#E5E0D5] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-serif tracking-[0.2em] uppercase text-neutral-500 font-semibold block">
                  {editingFaq ? 'UPDATE ENTRY' : 'NEW CONCIERGE FAQ'}
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-950">
                  {editingFaq ? 'Edit FAQ Item' : 'Add Storefront FAQ'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleModalSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                  Category *
                </label>
                <select
                  value={modalFormData.category}
                  onChange={(e) =>
                    setModalFormData(prev => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full bg-[#FAF8F3] border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="CUSTOM">+ Add Custom Category...</option>
                </select>

                {modalFormData.category === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    value={modalFormData.customCategory}
                    onChange={(e) =>
                      setModalFormData(prev => ({ ...prev, customCategory: e.target.value }))
                    }
                    placeholder="Enter new category name (e.g. VIP Concierge)..."
                    className="w-full mt-2 bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                )}
              </div>

              {/* Question Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={modalFormData.question}
                  onChange={(e) =>
                    setModalFormData(prev => ({ ...prev, question: e.target.value }))
                  }
                  placeholder="e.g. How long does made-to-measure tailoring take?"
                  className="w-full bg-[#FAF8F3] border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>

              {/* Answer Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                  Answer *
                </label>
                <textarea
                  required
                  rows="4"
                  value={modalFormData.answer}
                  onChange={(e) =>
                    setModalFormData(prev => ({ ...prev, answer: e.target.value }))
                  }
                  placeholder="Provide a clear, detailed, and elegant answer for the customer..."
                  className="w-full bg-[#FAF8F3] border border-neutral-300 rounded-xl p-3.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors resize-y"
                />
              </div>

              {/* Display Order & Active Toggle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Display Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalFormData.display_order}
                    onChange={(e) =>
                      setModalFormData(prev => ({ ...prev, display_order: e.target.value }))
                    }
                    className="w-full bg-[#FAF8F3] border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                  <span className="text-[10px] text-neutral-500 block">
                    Lower numbers display first (e.g. 1, 2, 3)
                  </span>
                </div>

                {/* Visible Status Toggle */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                    Storefront Visibility
                  </label>
                  <label className="flex items-center gap-2.5 bg-[#FAF8F3] border border-neutral-300 rounded-xl p-2.5 cursor-pointer hover:bg-neutral-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={modalFormData.is_active}
                      onChange={(e) =>
                        setModalFormData(prev => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="w-4 h-4 text-black accent-black rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-neutral-900">
                      {modalFormData.is_active ? 'Active (Live)' : 'Draft (Hidden)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSubmitting}
                  className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#111111] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all shadow-xs disabled:opacity-50"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingFaq ? 'Save Changes' : 'Create FAQ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-300 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-neutral-950 mb-1">
              Delete FAQ?
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              Are you sure you want to delete this FAQ: <br />
              <strong className="text-neutral-900">"{deleteTarget.question}"</strong>?
              <br />
              This action is permanent and will remove it from the database and storefront immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-all shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaqs;
