import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Save,
  RefreshCw,
  Sliders,
  Percent,
  CreditCard,
  Receipt,
  AlertCircle,
  Info,
  Calculator,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import apiClient from '../../lib/apiClient';

const DEFAULT_SETTINGS = {
  gst_percentage: 18,
  enable_tiered_gst: true,
  gst_threshold: 2500,
  gst_rate_below: 5,
  gst_rate_above: 18,
  card_charge_enabled: true,
  card_charge_percentage: 2,
  store_name: 'House of Urvaah',
  support_email: 'support@houseofurvaah.com',
  free_shipping_threshold: 2999,
  currency_symbol: '₹',
  maintenance_mode: false
};

export const AdminSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Live calculation preview simulator
  const [simSubtotal, setSimSubtotal] = useState(3200);
  const [simPaymentMethod, setSimPaymentMethod] = useState('card');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3800);
  };

  // Fetch active settings from server
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/api/settings/admin');
      if (res && res.success && res.data) {
        const d = res.data;
        const loaded = {
          gst_percentage: Number(d.gst_percentage) || 18,
          enable_tiered_gst: Boolean(d.enable_tiered_gst),
          gst_threshold: Number(d.gst_threshold) || 2500,
          gst_rate_below: Number(d.gst_rate_below) || 5,
          gst_rate_above: Number(d.gst_rate_above) || 18,
          card_charge_enabled: Boolean(d.card_charge_enabled),
          card_charge_percentage: Number(d.card_charge_percentage) || 2,
          store_name: d.store_name || 'House of Urvaah',
          support_email: d.support_email || 'support@houseofurvaah.com',
          free_shipping_threshold: Number(d.free_shipping_threshold) || 2999,
          currency_symbol: d.currency_symbol || '₹',
          maintenance_mode: Boolean(d.maintenance_mode)
        };
        setSettings(loaded);
        setInitialSettings(loaded);
      }
    } catch (err) {
      console.error('[AdminSettings] Failed to fetch settings:', err);
      showToast('error', err.message || 'Failed to load store settings from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  // Submit updated settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient('/api/settings/admin', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res && res.success && res.data) {
        const d = res.data;
        const updated = {
          gst_percentage: Number(d.gst_percentage) || 18,
          enable_tiered_gst: Boolean(d.enable_tiered_gst),
          gst_threshold: Number(d.gst_threshold) || 2500,
          gst_rate_below: Number(d.gst_rate_below) || 5,
          gst_rate_above: Number(d.gst_rate_above) || 18,
          card_charge_enabled: Boolean(d.card_charge_enabled),
          card_charge_percentage: Number(d.card_charge_percentage) || 2,
          store_name: d.store_name || 'House of Urvaah',
          support_email: d.support_email || 'support@houseofurvaah.com',
          free_shipping_threshold: Number(d.free_shipping_threshold) || 2999,
          currency_symbol: d.currency_symbol || '₹',
          maintenance_mode: Boolean(d.maintenance_mode)
        };
        setSettings(updated);
        setInitialSettings(updated);
        showToast('success', 'Store settings & tax rates successfully saved to database!');
      } else {
        throw new Error(res?.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('[AdminSettings] Save error:', err);
      showToast('error', err.message || 'Error saving settings to database.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to last saved
  const handleReset = () => {
    setSettings(initialSettings);
    showToast('info', 'Reverted unsaved changes to active database values.');
  };

  // Simulator calculations
  const simTaxRate = useMemo(() => {
    if (settings.enable_tiered_gst) {
      return simSubtotal > settings.gst_threshold ? settings.gst_rate_above : settings.gst_rate_below;
    }
    return settings.gst_percentage;
  }, [simSubtotal, settings]);

  const simTaxAmount = useMemo(() => {
    return Math.round(simSubtotal * (simTaxRate / 100));
  }, [simSubtotal, simTaxRate]);

  const simBasePayable = simSubtotal + simTaxAmount;

  const simCardSurcharge = useMemo(() => {
    if (simPaymentMethod === 'card' && settings.card_charge_enabled) {
      return Math.round(simBasePayable * (settings.card_charge_percentage / 100));
    }
    return 0;
  }, [simBasePayable, simPaymentMethod, settings]);

  const simGrandTotal = simBasePayable + simCardSurcharge;

  const formatCurrency = (val) => {
    return `${settings.currency_symbol || '₹'}${Number(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-2xl text-sm font-admin border bg-neutral-950 text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 min-w-[340px] max-w-[480px] ${
            toast.type === 'success'
              ? 'border-emerald-500/40 shadow-emerald-950/20'
              : toast.type === 'error'
              ? 'border-rose-500/40 shadow-rose-950/20'
              : 'border-amber-500/40 shadow-amber-950/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.2]" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 stroke-[2.2]" />
          ) : (
            <Info className="w-5 h-5 text-amber-400 shrink-0 stroke-[2.2]" />
          )}
          <span className="font-admin font-semibold tracking-wide text-xs sm:text-sm text-white leading-snug">
            {toast.message}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <AdminPageHeader
        title="Admin Settings & Configuration"
        subtitle="Configure dynamic GST tax rates, credit/debit card surcharges, and global storefront parameters."
      />

      {loading ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto stroke-[1.75]" />
          <p className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
            Loading Live Store Settings...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Main 2-Column Grid: Form Controls on Left, Live Simulator on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: GST Tax & Card Surcharge Settings (8 cols on large screens) */}
            <div className="lg:col-span-7 space-y-6">

              {/* ─────────────────────────────────────────────────────────────
                  CARD 1: GST & TAX PERCENTAGE CONFIGURATION
                  ───────────────────────────────────────────────────────────── */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-2xs space-y-5 transition-all">
                <div className="border-b border-neutral-100 pb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Percent className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider">
                        GST (Goods & Services Tax) Settings
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Dynamic tax rates applied during checkout, cart totals, and official tax invoices.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                    Active in DB
                  </span>
                </div>

                {/* Standard GST Percentage */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Standard / Flat GST Rate (%)
                    </label>
                    <span className="text-[11px] font-mono text-neutral-500">
                      Fallback if tiered rules are disabled
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.gst_percentage}
                      onChange={(e) => handleChange('gst_percentage', parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                      Quick Slabs:
                    </span>
                    {[0, 5, 12, 18, 28].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleChange('gst_percentage', pct)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-mono font-medium transition-all cursor-pointer ${
                          settings.gst_percentage === pct
                            ? 'bg-brand-dark text-white shadow-2xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tiered / Slab GST Toggle */}
                <div className="pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Enable Order-Value Tiered GST Rule</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 leading-snug">
                        Applies distinct GST rates based on cart subtotal threshold (e.g. 5% below ₹2,500 and 18% above ₹2,500).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('enable_tiered_gst', !settings.enable_tiered_gst)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.enable_tiered_gst ? 'bg-emerald-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.enable_tiered_gst ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Tiered Config Inputs (Expanded when toggle is ON) */}
                  {settings.enable_tiered_gst && (
                    <div className="mt-3 p-4 bg-amber-50/40 border border-amber-200/70 rounded-xl space-y-3.5 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider mb-1">
                          Cart Threshold Amount ({settings.currency_symbol || '₹'})
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                            {settings.currency_symbol || '₹'}
                          </span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={settings.gst_threshold}
                            onChange={(e) => handleChange('gst_threshold', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300/80 rounded-lg text-xs font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-amber-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider mb-1">
                            GST Rate Below &amp; Up to Threshold
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={settings.gst_rate_below}
                              onChange={(e) => handleChange('gst_rate_below', parseFloat(e.target.value) || 0)}
                              className="w-full pl-3 pr-8 py-2 bg-white border border-amber-300/80 rounded-lg text-xs font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-amber-700"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                              %
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider mb-1">
                            GST Rate Above Threshold
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={settings.gst_rate_above}
                              onChange={(e) => handleChange('gst_rate_above', parseFloat(e.target.value) || 0)}
                              className="w-full pl-3 pr-8 py-2 bg-white border border-amber-300/80 rounded-lg text-xs font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-amber-700"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-900 bg-white/80 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                        <strong>Rule Summary:</strong> Carts &le; {formatCurrency(settings.gst_threshold)} incur{' '}
                        <strong>{settings.gst_rate_below}% GST</strong>; carts &gt; {formatCurrency(settings.gst_threshold)} incur{' '}
                        <strong>{settings.gst_rate_above}% GST</strong>.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  CARD 2: CREDIT / DEBIT CARD SURCHARGE CONFIGURATION
                  ───────────────────────────────────────────────────────────── */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-2xs space-y-5 transition-all">
                <div className="border-b border-neutral-100 pb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <CreditCard className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider">
                        Card Processing Surcharge Settings
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Convenience surcharge applied dynamically when customers select Credit/Debit Card payment.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      settings.card_charge_enabled
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {settings.card_charge_enabled ? 'Surcharge Enabled' : 'Disabled'}
                  </span>
                </div>

                {/* Surcharge Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                      Apply Card Processing Surcharge
                    </div>
                    <div className="text-[11px] text-neutral-500 leading-snug">
                      When enabled, credit &amp; debit card transactions will include this dynamic fee at checkout. Zero surcharge is applied on UPI and Netbanking.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('card_charge_enabled', !settings.card_charge_enabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.card_charge_enabled ? 'bg-amber-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.card_charge_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Surcharge Rate Input */}
                {settings.card_charge_enabled && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Card Processing Surcharge Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={settings.card_charge_percentage}
                        onChange={(e) => handleChange('card_charge_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full pl-3 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                        %
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                        Common Presets:
                      </span>
                      {[1.0, 1.5, 1.75, 2.0, 2.5].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleChange('card_charge_percentage', pct)}
                          className={`text-[11px] px-2.5 py-0.5 rounded-md font-mono font-medium transition-all cursor-pointer ${
                            settings.card_charge_percentage === pct
                              ? 'bg-amber-700 text-white shadow-2xs'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  CARD 3: GLOBAL STOREFRONT PARAMETERS
                  ───────────────────────────────────────────────────────────── */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-neutral-500" />
                  <span>Storefront &amp; Operational Settings</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Store Brand Title
                  </label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Concierge &amp; Customer Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => handleChange('support_email', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Free Shipping Threshold ({settings.currency_symbol || '₹'})
                    </label>
                    <input
                      type="number"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => handleChange('free_shipping_threshold', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={settings.currency_symbol}
                      onChange={(e) => handleChange('currency_symbol', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                  <div>
                    <div className="text-xs font-semibold text-brand-dark">Maintenance Mode</div>
                    <div className="text-[11px] text-neutral-400">Temporarily restrict public customer access</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('maintenance_mode', !settings.maintenance_mode)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.maintenance_mode ? 'bg-amber-600' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Live Simulator & Summary (5 cols on large screens) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              
              {/* Simulator Card */}
              <div className="bg-[#FAF8F3] border border-amber-900/10 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="border-b border-amber-900/10 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-800" />
                    <h4 className="text-xs font-serif font-bold tracking-[0.16em] uppercase text-neutral-900">
                      Live Calculation Preview
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Sandbox
                  </span>
                </div>

                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Test sample order amounts below to immediately see how customer checkout totals and invoices are calculated using your active settings above.
                </p>

                {/* Simulator Inputs */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Sample Order Subtotal ({settings.currency_symbol || '₹'})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={simSubtotal}
                        onChange={(e) => setSimSubtotal(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-dark"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setSimSubtotal(2000)}
                          className="text-[10px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded font-mono text-neutral-700 cursor-pointer"
                        >
                          ₹2k
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimSubtotal(3500)}
                          className="text-[10px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded font-mono text-neutral-700 cursor-pointer"
                        >
                          ₹3.5k
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Simulated Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSimPaymentMethod('upi')}
                        className={`text-xs py-2 px-3 rounded-lg border font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          simPaymentMethod === 'upi'
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span>UPI / COD (0%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimPaymentMethod('card')}
                        className={`text-xs py-2 px-3 rounded-lg border font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          simPaymentMethod === 'card'
                            ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span>Card ({settings.card_charge_enabled ? `${settings.card_charge_percentage}%` : 'Off'})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calculation Breakdown Receipt */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-neutral-600">
                    <span className="font-sans uppercase text-[11px] tracking-wider">Subtotal</span>
                    <span className="font-bold text-neutral-900">{formatCurrency(simSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-neutral-700">
                    <span className="font-sans uppercase text-[11px] tracking-wider flex items-center gap-1">
                      <span>GST / Tax ({simTaxRate}%)</span>
                      {settings.enable_tiered_gst && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-sans">
                          {simSubtotal > settings.gst_threshold ? 'Above Slab' : 'Below Slab'}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-neutral-900">+{formatCurrency(simTaxAmount)}</span>
                  </div>

                  {simPaymentMethod === 'card' && settings.card_charge_enabled && (
                    <div className="flex justify-between items-center text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200/80">
                      <span className="font-sans uppercase text-[11px] font-semibold tracking-wider flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-amber-700" />
                        <span>Card Fee ({settings.card_charge_percentage}%)</span>
                      </span>
                      <span className="font-bold">+{formatCurrency(simCardSurcharge)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-neutral-600">
                    <span className="font-sans uppercase text-[11px] tracking-wider">Shipping</span>
                    <span className="font-sans text-[11px] font-bold text-emerald-800">COMPLIMENTARY</span>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-200 flex justify-between items-center text-sm font-bold text-neutral-900">
                    <span className="font-serif tracking-widest uppercase text-xs">Total Payable</span>
                    <span className="font-serif text-base text-neutral-950">{formatCurrency(simGrandTotal)}</span>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Calculations match checkout orders and invoice generation 1:1.</span>
                </div>
              </div>

              {/* Action Buttons Box */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                {hasChanges && (
                  <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                      <span className="font-semibold">You have unsaved changes.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] font-bold underline hover:text-amber-950 cursor-pointer"
                    >
                      Revert
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-[0.16em] hover:bg-black transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Live Configuration</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={fetchSettings}
                    disabled={loading || saving}
                    title="Reload from Database"
                    className="p-3.5 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;
