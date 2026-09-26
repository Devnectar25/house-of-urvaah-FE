import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Package, 
  FolderTree, 
  ShoppingCart, 
  Ticket, 
  Users, 
  RotateCcw, 
  Star, 
  BarChart3, 
  Settings, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

const PAGE_CONFIGS = {
  '/admin/products': {
    title: 'Products Management',
    subtitle: 'Manage catalog, inventory, pricing, variants, and product status.',
    icon: Package,
    module: 'Catalog & Inventory',
  },
  '/admin/categories': {
    title: 'Categories & Taxonomy',
    subtitle: 'Keep your collections organized and easy to discover.',
    icon: FolderTree,
    module: 'Catalog Architecture',
  },
  '/admin/orders': {
    title: 'Orders & Shipments',
    subtitle: 'Track incoming customer orders, fulfillment pipelines, and tracking numbers.',
    icon: ShoppingCart,
    module: 'Order Fulfillment',
  },
  '/admin/coupons': {
    title: 'Coupons & Promotions',
    subtitle: 'Create promo codes, percentage discounts, and seasonal campaign incentives.',
    icon: Ticket,
    module: 'Marketing & Discounts',
  },
  '/admin/customers': {
    title: 'Customers Directory',
    subtitle: 'View client accounts, order history, VIP tiers, and contact records.',
    icon: Users,
    module: 'Customer Relations',
  },
  '/admin/refunds': {
    title: 'Refunds & Returns',
    subtitle: 'Review return requests, process reverse logistics, and approve refund claims.',
    icon: RotateCcw,
    module: 'Returns Management',
  },
  '/admin/reviews': {
    title: 'Customer Reviews & Feedback',
    subtitle: 'Moderate verified buyer ratings, testimonials, and product reviews.',
    icon: Star,
    module: 'Social Proof & Ratings',
  },
  '/admin/analytics': {
    title: 'Analytics & Reporting',
    subtitle: 'Comprehensive sales performance, conversion metrics, and luxury buyer trends.',
    icon: BarChart3,
    module: 'Business Intelligence',
  },
  '/admin/settings': {
    title: 'Store & Portal Settings',
    subtitle: 'Configure store currency, shipping zones, tax rules, and administrative roles.',
    icon: Settings,
    module: 'System Configuration',
  },
};

export const AdminPlaceholderPage = ({ title: overrideTitle, subtitle: overrideSubtitle }) => {
  const location = useLocation();
  const config = PAGE_CONFIGS[location.pathname] || {
    title: overrideTitle || 'Admin Module',
    subtitle: overrideSubtitle || 'This administrative section is currently being prepared for the next build phase.',
    icon: Sparkles,
    module: 'Operations',
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400 font-sans mb-1.5">
            <span>Admin</span>
            <span>/</span>
            <span className="text-neutral-700 font-medium">{config.module}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark tracking-tight">
            {config.title}
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 bg-neutral-100 border border-neutral-200 rounded-full text-xs font-sans text-neutral-600">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Scheduled for Next Phase</span>
        </div>
      </div>

      {/* Main Placeholder Container */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 shadow-editorial flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-brand-dark mb-5 shadow-xs">
          <Icon className="w-8 h-8 stroke-[1.5]" />
        </div>

        <span className="text-[11px] font-sans tracking-[0.25em] uppercase text-neutral-400 font-semibold mb-2">
          {config.module}
        </span>

        <h2 className="text-xl sm:text-2xl font-serif font-bold text-brand-dark uppercase tracking-wider mb-3 max-w-lg">
          {config.title} Interface
        </h2>

        <p className="text-xs sm:text-sm text-neutral-500 max-w-md font-sans leading-relaxed mb-8">
          {config.subtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left font-sans text-xs">
          <div className="p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
            <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">Status</span>
            <span className="font-medium text-neutral-800">Shell Route Active</span>
          </div>
          <div className="p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
            <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">Route Path</span>
            <span className="font-mono text-neutral-800 text-[11px]">{location.pathname}</span>
          </div>
          <div className="p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
            <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">Access Level</span>
            <span className="font-medium text-brand-accent">Admin Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlaceholderPage;
