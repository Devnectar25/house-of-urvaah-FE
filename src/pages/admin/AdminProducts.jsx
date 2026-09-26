import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Package,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  FolderTree,
  Edit3
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { EditProductModal } from '../../components/admin/EditProductModal';
import { AddProductModal } from '../../components/admin/AddProductModal';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Edit & Add Product Modal States
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toast notification helper
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const res = await apiClient('/api/categories');
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted) {
          setCategories(list);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  // Fetch products when page, debounced search, or selected category changes
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage);
      params.set('limit', limit);
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }

      const response = await apiClient(`/api/products?${params.toString()}`);
      const rawData = response?.data;

      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        setProducts(rawData.data || []);
        setTotalProducts(rawData.total ?? (rawData.data ? rawData.data.length : 0));
        setTotalPages(rawData.totalPages || Math.ceil((rawData.total || 1) / limit));
      } else if (Array.isArray(rawData)) {
        setProducts(rawData);
        setTotalProducts(rawData.length);
        setTotalPages(1);
      } else if (Array.isArray(response)) {
        setProducts(response);
        setTotalProducts(response.length);
        setTotalPages(1);
      } else {
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products from server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle active state toggle with optimistic update & rollback on error
  const handleToggleActive = async (product) => {
    if (togglingId) return;
    const id = product.id;
    setTogglingId(id);
    const previousState = product.active;

    // Optimistically toggle active in UI
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !previousState } : p))
    );

    try {
      const res = await apiClient(`/api/products/${id}/toggle-active`, {
        method: 'PATCH',
      });
      const updatedProduct = res?.data;
      if (updatedProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: updatedProduct.active } : p))
        );
      }
      showToast(
        'success',
        `Product "${product.name}" ${!previousState ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err) {
      // Rollback UI to previous state on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: previousState } : p))
      );
      showToast('error', `Failed to update status: ${err.message || 'Server error'}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  // Open / Close Edit Modal
  const handleOpenEditModal = (product) => {
    setSelectedProductForEdit(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProductForEdit(null);
  };

  const handleProductUpdated = (updatedProduct) => {
    showToast('success', `Product "${updatedProduct.name || 'item'}" updated successfully!`);
    fetchProducts();
  };

  const handleProductDeleted = (deletedId) => {
    showToast('success', `Product #${deletedId} deleted successfully!`);
    fetchProducts();
  };

  const handleProductCreated = (newProduct) => {
    showToast('success', `Product "${newProduct.title || newProduct.name || 'item'}" created successfully!`);
    fetchProducts();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-xl shadow-2xl text-xs font-serif border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
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
          <span className="font-serif tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Edit Product Modal */}
      <EditProductModal
        product={selectedProductForEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductCreated={handleProductCreated}
      />

      {/* Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark tracking-tight">
            Product Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Manage your store products, catalog taxonomy, pricing, and stock status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-brand-dark text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search & Filter Row */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-brand-dark"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Dropdown Filter */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[180px]">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full appearance-none bg-neutral-50 border border-neutral-200 text-brand-dark text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category_id || cat.id || cat.name} value={cat.category_id || cat.id || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <FolderTree className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            title="Refresh product list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Table Subheader Count */}
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/50">
          <h2 className="text-xs font-semibold tracking-wider text-brand-dark uppercase">
            All Products <span className="ml-1 px-2 py-0.5 bg-neutral-200/60 rounded-full text-neutral-700 text-[11px]">{totalProducts}</span>
          </h2>
          {debouncedSearch || selectedCategory ? (
            <span className="text-[11px] text-neutral-500">
              Filtered view
            </span>
          ) : null}
        </div>

        {/* Error Banner */}
        {error && !loading && (
          <div className="p-6 bg-rose-50/70 border-b border-rose-200 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-rose-900 mb-1">Failed to Load Products</h4>
            <p className="text-xs text-rose-700 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Request
            </button>
          </div>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-neutral-50/80 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80">
                <th className="py-3 px-4 w-16">Image</th>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-center w-24">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 text-xs text-brand-dark">
              {/* Skeleton Loader State */}
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="w-12 h-14 bg-neutral-200 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4 space-y-2">
                      <div className="h-4 bg-neutral-200 rounded w-48" />
                      <div className="h-3 bg-neutral-200 rounded w-24" />
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="h-3.5 bg-neutral-200 rounded w-28" />
                      <div className="h-3 bg-neutral-200 rounded w-16" />
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="h-4 bg-neutral-200 rounded w-20" />
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="h-5 bg-neutral-200 rounded-full w-24" />
                      <div className="h-3 bg-neutral-200 rounded w-12" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-6 w-11 bg-neutral-200 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 && !error ? (
                /* Empty State */
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-brand-dark mb-1">No products found</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-4">
                      {debouncedSearch || selectedCategory
                        ? 'No products match your current search query or category filter.'
                        : 'No products are currently registered in your store database.'}
                    </p>
                    {(debouncedSearch || selectedCategory) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('');
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center text-xs font-semibold text-brand-dark bg-brand-sand hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors"
                      >
                        Reset Search & Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                /* Product Row List */
                products.map((product) => {
                  const qty = product.stockQuantity ?? 0;
                  let statusLabel = 'Available';
                  let statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';

                  if (qty === 0 || product.inStock === false) {
                    statusLabel = 'Out of Stock';
                    statusStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
                  } else if (qty < 5) {
                    statusLabel = 'Low Stock';
                    statusStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
                  }

                  return (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      qty={qty}
                      statusLabel={statusLabel}
                      statusStyle={statusStyle}
                      togglingId={togglingId}
                      handleToggleActive={handleToggleActive}
                      onOpenEditModal={handleOpenEditModal}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Controls */}
        {!loading && !error && totalProducts > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200/80 px-6 py-3.5 bg-neutral-50/50 gap-3">
            <div className="text-xs text-neutral-500">
              Showing <span className="font-semibold text-neutral-800">{(currentPage - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-neutral-800">
                {Math.min(currentPage * limit, totalProducts)}
              </span>{' '}
              of <span className="font-semibold text-neutral-800">{totalProducts}</span> products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <span className="text-xs text-neutral-600 font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Subcomponent for each product row with defensive image handling & Edit modal trigger
const ProductTableRow = ({
  product,
  qty,
  statusLabel,
  statusStyle,
  togglingId,
  handleToggleActive,
  onOpenEditModal,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <tr className="hover:bg-neutral-50/80 transition-colors group">
      {/* Thumbnail */}
      <td className="py-3.5 px-4 cursor-pointer" onClick={() => onOpenEditModal(product)}>
        <div className="w-12 h-14 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 border border-neutral-200/80 flex items-center justify-center group-hover:border-brand-dark transition-colors">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              onError={() => setImgError(true)}
            />
          ) : (
            <Package className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </td>

      {/* Product Info Cell (Triggers Edit Modal) */}
      <td className="py-3.5 px-4 max-w-xs">
        <button
          type="button"
          onClick={() => onOpenEditModal(product)}
          className="text-left font-semibold text-brand-dark hover:underline text-xs leading-snug line-clamp-2 cursor-pointer flex items-center gap-1 group-hover:text-black"
        >
          <span>{product.name}</span>
          <Edit3 className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-neutral-400 font-mono">
            ID: #{product.id}
          </span>
          {product.styleCode && (
            <span className="text-[11px] text-neutral-400 font-mono">
              | SKU: {product.styleCode}
            </span>
          )}
          <a
            href={`/product/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-brand-dark inline-flex items-center text-[11px] ml-1"
            title="View on storefront"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </td>

      {/* Category & Subcategory */}
      <td className="py-3.5 px-4">
        <div className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
          {product.category || 'Uncategorized'}
        </div>
        {product.subCategory ? (
          <div className="text-[11px] text-neutral-400 mt-0.5 font-normal">
            {product.subCategory}
          </div>
        ) : null}
      </td>

      {/* Price & Promo */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-brand-dark">
            ₹{product.price?.toLocaleString('en-IN') || '0.00'}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[11px] text-neutral-400 line-through">
              ₹{product.originalPrice?.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {product.promoted ? (
          <span className="inline-block mt-1 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded">
            Promoted
          </span>
        ) : null}
      </td>

      {/* Stock Status */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle}`}>
          {statusLabel}
        </span>
        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
          Qty: {qty}
        </div>
      </td>

      {/* Active Toggle Switch */}
      <td className="py-3.5 px-4 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(product);
          }}
          disabled={togglingId === product.id}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            product.active ? 'bg-brand-dark' : 'bg-neutral-200'
          } ${togglingId === product.id ? 'opacity-50 cursor-wait' : ''}`}
          role="switch"
          aria-checked={product.active}
          title={product.active ? 'Click to deactivate' : 'Click to activate'}
        >
          <span className="sr-only">Toggle active status</span>
          {togglingId === product.id ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            </span>
          ) : (
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                product.active ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          )}
        </button>
      </td>
    </tr>
  );
};

export default AdminProducts;
