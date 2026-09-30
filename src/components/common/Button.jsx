import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'minimal'
  size = 'md', // 'sm', 'md', 'lg'
  fullWidth = false,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-brand-dark text-white border border-brand-dark hover:bg-white hover:text-black hover:border-black transition-colors duration-300',
    secondary: 'bg-brand-sand text-brand-dark border border-brand-sand hover:bg-black hover:text-white hover:border-black transition-colors duration-300',
    outline: 'bg-transparent text-brand-dark border border-brand-dark hover:bg-black hover:text-white hover:border-black transition-colors duration-300',
    outlineWhite: 'bg-transparent text-white border border-white hover:bg-white hover:text-black hover:border-white transition-colors duration-300',
    minimal: 'bg-transparent text-brand-dark hover:text-neutral-500 p-0 tracking-widest relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-current',
  };

  const sizes = {
    sm: 'text-[10px] px-4 py-2 font-semibold',
    md: 'text-xs px-6 py-3 font-medium',
    lg: 'text-sm px-8 py-4 font-medium',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${
        variant !== 'minimal' ? sizes[size] : ''
      } ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
