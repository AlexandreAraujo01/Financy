import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LOGIN, ME, REGISTER } from '@/graphql/operations';
import type { User } from '@/graphql/types';
import { authStorage } from '@/lib/auth-storage';
import { errorCode } from '@/lib/errors';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login(data: { email: string; password: string }, remember: boolean): Promise<void>;
  register(data: { name: string; email: string; password: string }): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const [token, setToken] = useState(() => authStorage.get());
  // O usuário logado vem do `me`, que o backend responde a partir do token.
  const { data, loading, error } = useQuery(ME, { skip: !token });
  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);

  // Token expirado ou conta apagada: volta pro login. Erro de rede (API fora) não desloga.
  const code = errorCode(error);
  useEffect(() => {
    if (code === 'UNAUTHENTICATED' || code === 'NOT_FOUND') {
      authStorage.clear();
      setToken(null);
    }
  }, [code]);

  async function signIn(newToken: string, user: User, remember: boolean) {
    authStorage.set(newToken, remember);
    // Troca de conta: nada do usuário anterior pode sobrar no cache.
    await client.clearStore();
    client.writeQuery({ query: ME, data: { me: user } });
    setToken(newToken);
  }

  const value: AuthContextValue = {
    user: token ? (data?.me ?? null) : null,
    loading: Boolean(token) && loading && !data,
    async login(input, remember) {
      const { data } = await loginMutation({ variables: { data: input } });
      if (data) await signIn(data.login.token, data.login.user, remember);
    },
    async register(input) {
      const { data } = await registerMutation({ variables: { data: input } });
      if (data) await signIn(data.register.token, data.register.user, true);
    },
    async logout() {
      authStorage.clear();
      setToken(null);
      await client.clearStore();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
