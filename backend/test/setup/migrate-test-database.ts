import { execSync } from 'node:child_process';
import { testEnv } from './test-env';

// Roda uma vez antes dos testes de integração: aplica as migrations do Prisma no banco de teste.
export default function migrateTestDatabase() {
  const database = new URL(testEnv.DATABASE_URL ?? '').pathname.slice(1);
  // Os testes apagam as tabelas, então nunca rodar fora do banco de teste.
  if (database !== 'financy_test') {
    throw new Error(`Refusing to run against ${database || 'an empty DATABASE_URL'}`);
  }

  execSync('prisma migrate deploy', { env: { ...process.env, ...testEnv }, stdio: 'pipe' });
}
