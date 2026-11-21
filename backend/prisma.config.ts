import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const url = process.env['DATABASE_URL'];

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Sem URL o prisma generate (postinstall) ainda funciona; só migrate precisa do banco.
  datasource: url ? { url } : {},
});
