import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { getStoredUser, clearAuthSession } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';
import { ShieldCheck, LogOut } from 'lucide-react';

export const AdminDashboardPlaceholder = () => {
  const navigate = useNavigate();
  const { logoutUser } = useCart();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthSession();
    if (typeof logoutUser === 'function') {
      logoutUser();
    }
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-brand-sand flex flex-col font-serif">
      {/* Admin Minimal Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Logo className="h-10 sm:h-12" />
          <span className="hidden sm:inline-block h-6 w-[1px] bg-neutral-300" />
          <span className="hidden sm:inline-block text-xs uppercase tracking-[0.2em] font-semibold text-brand-dark">
            Admin Console
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-neutral-900">{user?.username || 'Admin User'}</p>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-sans">{user?.role || 'Administrator'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Placeholder Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-neutral-200 shadow-editorial p-8 sm:p-10 text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-[0.1em] text-brand-dark uppercase mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 tracking-wide mb-6">
            Authentication successful. Welcome to the House of Urvaah management portal.
          </p>
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left text-xs space-y-1.5 font-sans mb-6">
            <p><strong className="font-semibold text-neutral-900 font-serif">Logged in as:</strong> {user?.username || 'Admin'}</p>
            <p><strong className="font-semibold text-neutral-900 font-serif">Assigned Role:</strong> {user?.role || 'Administrator'}</p>
            <p><strong className="font-semibold text-neutral-900 font-serif">Status:</strong> Authenticated & Authorized</p>
          </div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest">
            Full admin dashboard features will be linked in the next phase.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPlaceholder;
