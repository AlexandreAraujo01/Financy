import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline';
type Size = 'md' | 'sm';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  outline: 'border border-gray-300 bg-surface text-gray-700 hover:bg-gray-100',
};

const sizes: Record<Size, string> = {
  md: 'h-12 px-4 text-base',
  sm: 'h-9 px-3 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'danger';
}

export function IconButton({ label, tone = 'default', className = '', ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-surface transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 ${tone === 'danger' ? 'text-red-base' : 'text-gray-700'} ${className}`}
      {...props}
    />
  );
}
