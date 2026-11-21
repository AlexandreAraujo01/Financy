import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-gray-200 bg-surface ${className}`} {...props} />;
}

// Título em caixa alta usado nos cards e cabeçalhos de seção.
export function Eyebrow({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-xs font-medium uppercase tracking-[0.6px] text-gray-500 ${className}`}
      {...props}
    />
  );
}
