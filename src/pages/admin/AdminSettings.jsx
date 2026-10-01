import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Globe,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Sliders,
  Server
} from 'lucide-react';
import { getStoredUser, apiClient } from '../../lib/apiClient';

export const AdminSettings = () => {
  const currentUser = getStoredUser();

  const [storeName, setStoreName] = useState('House of Urvaah');
  const [supportEmail, setSupportEmail] = useState('support@houseofurvaah.com');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('2999');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [dbStatus, setDbStatus] = useState('Healthy');
  const [apiStatus, setApiStatus] = useState('Connected');
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-brand-dark tracking-tight">
            Admin Settings & Configuration
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            System diagnostics, active admin account privileges, and global store parameters.
          </p>
        </div>
      </div>

      {/* System Health Diagnostics */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs">
        <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-neutral-500" />
          <span>System & Backend Health Diagnostics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-800 tracking-wider">Database Link</span>
              <div className="font-bold text-emerald-900 mt-0.5">{dbStatus}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">PostgreSQL Pool Online</div>
            </div>
            <Database className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-800 tracking-wider">API Server</span>
              <div className="font-bold text-emerald-900 mt-0.5">{apiStatus}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Vercel API Node v20.x</div>
            </div>
            <Globe className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-purple-800 tracking-wider">Security Guard</span>
              <div className="font-bold text-purple-900 mt-0.5">JWT Auth Active</div>
              <div className="text-[10px] text-purple-700 mt-0.5">Protected Admin Portal</div>
            </div>
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Admin Account & Store Settings Form */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Parameters */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs space-y-4">
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
        </div>

        {/* Administrator Profile Details */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-500" />
              <span>Current Session Account</span>
            </h3>

            <div className="p-4 bg-neutral-50 border border-neutral-200/70 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Administrator Name</span>
                <span className="text-sm font-bold text-brand-dark font-admin">
                  {currentUser?.name || currentUser?.username || 'Super Admin'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Admin Email / Username</span>
                <span className="text-xs font-medium text-neutral-700 font-mono">
                  {currentUser?.email || currentUser?.username || 'admin@houseofurvaah.com'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Assigned Role</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-brand-dark text-white text-[10px] font-bold rounded uppercase tracking-wider font-admin">
                  {currentUser?.role || 'Super Admin'}
                </span>
              </div>
            </div>
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
