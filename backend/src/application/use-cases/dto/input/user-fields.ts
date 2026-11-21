import { z } from 'zod';

// Regras de formato compartilhadas entre os inputs de usuário.
export const userId = z.uuid();
export const userName = z.string().trim().min(1).max(100);
export const userEmail = z.string().trim().pipe(z.email());
// O bcrypt ignora o que passa de 72 bytes.
export const userPassword = z.string().min(8).max(72);
