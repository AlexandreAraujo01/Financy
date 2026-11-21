import { ArrowLeftRight, LayoutDashboard, Repeat, Tags } from 'lucide-react';
import { Link, Navigate, NavLink, Outlet } from 'react-router';
import { useAuth } from '@/contexts/auth';
import { Avatar } from './ui/avatar';
import { Logo } from './ui/logo';
import { ThemeToggle } from './theme-toggle';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/recorrentes', label: 'Recorrentes', icon: Repeat },
];

// Páginas logadas: sem usuário, volta pro login.
export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageMessage>Carregando...</FullPageMessage>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-surface px-4 pt-4 md:px-8 lg:px-12 lg:pb-4">
        <div className="mx-auto flex max-w-[1184px] flex-wrap items-center justify-between gap-y-4">
          <Link to="/" aria-label="Ir para o dashboard">
            <Logo size="sm" />
          </Link>
          <nav aria-label="Navegação principal" className="order-last grid w-full grid-cols-4 gap-1 text-xs sm:text-sm lg:order-none lg:flex lg:w-auto lg:gap-5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  isActive
                    ? 'flex min-h-12 flex-col items-center justify-center gap-1 border-b-2 border-brand-foreground px-1 pb-3 font-semibold text-brand-foreground lg:min-h-10 lg:flex-row lg:border-0 lg:pb-0'
                    : 'flex min-h-12 flex-col items-center justify-center gap-1 border-b-2 border-transparent px-1 pb-3 text-gray-600 transition-colors hover:text-gray-800 lg:min-h-10 lg:flex-row lg:border-0 lg:pb-0'
                }
              >
                <link.icon aria-hidden="true" className="size-[18px] lg:hidden" />
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/perfil" aria-label="Meu perfil" className="flex items-center justify-center rounded-full">
              <Avatar name={user.name} />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:p-6 md:p-8 lg:p-12">
        <Outlet />
      </main>
    </div>
  );
}

export function FullPageMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
      {children}
    </div>
  );
}
