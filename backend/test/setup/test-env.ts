import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Variáveis do .env.test; entram antes do .env, que o dotenv não sobrescreve.
export const testEnv = parseEnv(readFileSync('.env.test', 'utf8')) as Record<string, string>;
