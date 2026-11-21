import { initials } from '@/lib/format';

export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gray-300 font-medium text-gray-800 ${size === 'sm' ? 'size-9 text-sm' : 'size-16 text-2xl'}`}
    >
      {initials(name)}
    </span>
  );
}
