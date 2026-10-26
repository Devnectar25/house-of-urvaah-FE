import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Loader2, Search } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// Fired after any card links / unlinks a product so every card on the page reloads its list
const LINKS_CHANGED = 'urvaah:fabric-links-changed';

const toSlug = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * "Related products" for one fabric video card: a checkbox dropdown of every product (reloaded on
 * open, so newly created products appear). Ticking a product links it to this fabric (its
 * fabric_slug), unticking removes the link. The same link is editable in the product form.
 * A product belongs to one fabric, so ticking it here moves it from any other fabric.
 */
export const FabricProductPicker = ({ fabricSlug, fabricLabel, onNotify }) => {
  const slug = toSlug(fabricSlug);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/api/products?page=1&limit=500', { isAdmin: true });
      const raw = res?.data;
      const list = Array.isArray(raw) ? raw : (raw?.data || []);
      setProducts(list.map((p) => ({ id: String(p.id || p.product_id), name: p.name || p.title || `Product #${p.id}`, image: p.image, fabric: toSlug(p.fabric_slug || p.fabricSlug), active: p.active !== false && p.is_active !== false })));
    } catch (err) {
      onNotify?.('error', err.message || 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  // Linked count is shown on the closed button too
  useEffect(() => {
    loadProducts();
    const reload = () => loadProducts();
    window.addEventListener(LINKS_CHANGED, reload);
    return () => window.removeEventListener(LINKS_CHANGED, reload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const toggle = async (p) => {
    if (!slug || savingId) return;
    setSavingId(p.id);
    try {
      // Decide from the product's current saved fabric, not a possibly stale list
      const fresh = await apiClient(`/api/products/${p.id}`, { isAdmin: true }).catch(() => null);
      const currentFabric = fresh ? toSlug((fresh.data || fresh).fabric_slug || (fresh.data || fresh).fabricSlug) : p.fabric;
      const linking = currentFabric !== slug;
      await apiClient(`/api/products/${p.id}`, {
        method: 'PUT',
        isAdmin: true,
        body: JSON.stringify({ fabric_slug: linking ? slug : '' })
      });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, fabric: linking ? slug : '' } : x)));
      window.dispatchEvent(new CustomEvent(LINKS_CHANGED));
      onNotify?.('success', linking ? `"${p.name}" added to ${fabricLabel || 'this fabric'}` : `"${p.name}" removed from ${fabricLabel || 'this fabric'}`);
    } catch (err) {
      onNotify?.('error', err.message || 'Could not update the product');
    } finally {
      setSavingId(null);
    }
  };

  const linked = products.filter((p) => p.fabric === slug);
  const shown = products
    .filter((p) => !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(b.fabric === slug) - Number(a.fabric === slug) || a.name.localeCompare(b.name));

  return (
    <div className="space-y-1.5 relative" ref={boxRef}>
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Related Products</label>
      <button
        type="button"
        disabled={!slug}
        onClick={() => { if (!open) loadProducts(); setOpen((v) => !v); }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] text-neutral-800 hover:border-neutral-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate text-left">
          {!slug ? 'Add a tag label first' : linked.length ? linked.map((p) => p.name).join(', ') : 'Select products made in this fabric'}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {linked.length > 0 && <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-bold">{linked.length}</span>}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="mt-1 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-2 border-b border-neutral-100 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full text-[11px] focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {loading && products.length === 0 ? (
              <div className="p-3 text-[11px] text-neutral-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading products...</div>
            ) : shown.length === 0 ? (
              <div className="p-3 text-[11px] text-neutral-500">No products found</div>
            ) : shown.map((p) => {
              const checked = p.fabric === slug;
              const elsewhere = !checked && p.fabric;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p)}
                  disabled={Boolean(savingId)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 transition-colors cursor-pointer disabled:cursor-wait"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-300'}`}>
                    {savingId === p.id ? <Loader2 className="w-3 h-3 animate-spin text-neutral-400" /> : checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  {p.image && <img src={p.image} alt="" className="w-7 h-8 object-cover rounded shrink-0 bg-neutral-100" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-neutral-900 truncate">{p.name}</span>
                    <span className="block text-[10px] text-neutral-400">
                      #{p.id}{!p.active ? ' • Inactive' : ''}{elsewhere ? ` • now in ${p.fabric}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricProductPicker;
