import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action: ReactNode;
}) {
  return (
    <header className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center [&>button]:shrink-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-base text-gray-600">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
