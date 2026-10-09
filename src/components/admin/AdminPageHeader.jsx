import React from 'react';

/**
 * Shared Admin Page Header Component
 * Provides a standardized #F4F1EA warm cream header card across all admin pages
 * where the page title and description text exist.
 */
export const AdminPageHeader = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  actions,
  children,
  className = ''
}) => {
  return (
    <div
      className={`bg-[#F4F1EA] border border-[#E5E0D5] rounded-2xl p-5 sm:p-6 shadow-2xs transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          {badge && (
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              {badge}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-neutral-950 tracking-tight flex items-center gap-2.5">
            {Icon && <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-900 shrink-0 stroke-[2]" />}
            <span>{title}</span>
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-600 font-sans mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-[#E5E0D5]/70">
          {children}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;
