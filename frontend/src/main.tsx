import { ApolloProvider } from '@apollo/client/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './contexts/auth';
import { ThemeProvider } from './contexts/theme';
import { apolloClient } from './lib/apollo';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ApolloProvider>
    </ThemeProvider>
  </StrictMode>,
);
