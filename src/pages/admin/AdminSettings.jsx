import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Save,
  RefreshCw,
  Sliders,
  Building2,
  ExternalLink
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export const AdminSettings = () => {

  const [storeName, setStoreName] = useState('House of Urvaah');
  const [supportEmail, setSupportEmail] = useState('support@houseofurvaah.com');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('2999');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('success', 'Admin settings updated successfully!');
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-2xl text-sm font-admin border bg-neutral-950 text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 min-w-[340px] max-w-[480px] ${
            toast.type === 'success' ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-rose-500/40 shadow-rose-950/20'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.2]" />
          <span className="font-admin font-semibold tracking-wide text-xs sm:text-sm text-white leading-snug">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <AdminPageHeader
        title="Admin Settings & Configuration"
        subtitle="Active admin account privileges and global store parameters."
      />

      {/* Quick Link to Boutiques & Concierge */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Client Services & Store Locations</span>
          </span>
          <h3 className="text-base font-serif font-bold tracking-wide uppercase">
            Boutiques & Atelier Concierge Settings
          </h3>
          <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
            Dynamically update the Atelier Concierge email, hotline, operating hours, and manage flagship boutique locations shown on the Contact page and global footer.
          </p>
        </div>
        <Link
          to="/admin/modify-ui/boutiques-concierge"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors shrink-0 shadow-sm"
        >
          <span>Manage Boutiques & Concierge</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Admin Store Settings Form */}
      <form onSubmit={handleSaveSettings} className="max-w-2xl">
        {/* Store Parameters */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-500" />
            <span>Storefront Settings</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Store Title
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Customer Support Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Free Shipping Threshold
              </label>
              <input
                type="text"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
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
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                maintenanceMode ? 'bg-amber-600' : 'bg-neutral-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
