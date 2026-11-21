import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/app-layout';
import { CategoriesPage } from './pages/categories';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/login';
import { ProfilePage } from './pages/profile';
import { RecurringPage } from './pages/recurring';
import { RegisterPage } from './pages/register';
import { TransactionsPage } from './pages/transactions';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transacoes" element={<TransactionsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="recorrentes" element={<RecurringPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
