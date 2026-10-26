import React from 'react';
import { Check } from 'lucide-react';
import { OCCASION_OPTIONS, FABRIC_OPTIONS, WEAR_TWO_WAYS_TAG } from '../../constants/productFilters';

const Chip = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
      selected
        ? 'bg-neutral-900 text-white border-neutral-900'
        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
    }`}
  >
    {selected && <Check className="w-3 h-3" />}
    {label}
  </button>
);

/**
 * Storefront filter assignment for a product: pick any number of occasions and fabrics, plus
 * "Wear it two ways". Shoppers who choose one of these in a collection's Filters panel see it.
 */
export const ProductFilterPicker = ({ value, onChange }) => {
  const v = value || { occasions: [], fabrics: [], wearTwoWays: false, otherTags: [] };
  const toggle = (key, option) => {
    const list = v[key] || [];
    onChange({ ...v, [key]: list.includes(option) ? list.filter((o) => o !== option) : [...list, option] });
  };
  const count = v.occasions.length + v.fabrics.length + (v.wearTwoWays ? 1 : 0);

  return (
    <div className="space-y-3 p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/60">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">Shop Filters</label>
        <span className="text-[11px] text-neutral-500">
          {count > 0 ? `${count} selected` : 'Not shown under any filter yet'}
        </span>
      </div>
      <p className="text-[11px] text-neutral-500 -mt-1.5">
        Choose every filter this product belongs to. Shoppers who pick one of these in a collection's Filters panel will see it.
      </p>

      <div className="space-y-1.5">
        <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Occasion</span>
        <div className="flex flex-wrap gap-2">
          {OCCASION_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={v.occasions.includes(o)} onClick={() => toggle('occasions', o)} />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Fabric</span>
        <div className="flex flex-wrap gap-2">
          {FABRIC_OPTIONS.map((f) => (
            <Chip key={f} label={f} selected={v.fabrics.includes(f)} onClick={() => toggle('fabrics', f)} />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Style</span>
        <div className="flex flex-wrap gap-2">
          <Chip label={WEAR_TWO_WAYS_TAG} selected={v.wearTwoWays} onClick={() => onChange({ ...v, wearTwoWays: !v.wearTwoWays })} />
        </div>
      </div>
    </div>
  );
};

export default ProductFilterPicker;
