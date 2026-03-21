import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-gradient-to-r from-sky-500 to-blue-500 hover:shadow-[0_0_18px_rgba(29,161,242,0.45)] hover:-translate-y-0.5 text-white transition-all duration-200',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
  ghost:     'bg-transparent hover:bg-slate-800 text-slate-300',
  danger:    'bg-red-600 hover:bg-red-500 text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={[
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(' ')}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    {children}
  </button>
);

export default Button;
