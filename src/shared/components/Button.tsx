import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-slate-300',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:text-slate-400',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 disabled:text-slate-400',
  ghost: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:text-slate-400',
};

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
