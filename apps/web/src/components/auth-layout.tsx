import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/auth';
import { FullPageMessage } from './app-layout';
import { Logo } from './ui/logo';
import { ThemeToggle } from './theme-toggle';

// Login e cadastro: quem já está logado vai direto pro dashboard.
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageMessage>Carregando...</FullPageMessage>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 px-4 py-6 sm:gap-8 sm:p-12">
      <div className="flex w-full max-w-[448px] items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-[448px] flex-col gap-8 rounded-xl border border-gray-200 bg-surface p-5 sm:p-[33px]">
        <header className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-base text-gray-600">{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-gray-300" />
      <span className="text-sm text-gray-500">ou</span>
      <span className="h-px flex-1 bg-gray-300" />
    </div>
  );
}
