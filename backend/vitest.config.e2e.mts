import { defineConfig } from 'vitest/config';
import { testEnv } from './test/setup/test-env';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['test/setup/migrate-test-database.ts'],
    // Os arquivos limpam tabelas do mesmo banco, então rodam um de cada vez.
    fileParallelism: false,
    env: testEnv,
  },
});
