import { z } from 'zod';
import { userEmail } from './user-fields';

export const loginUserInputSchema = z.object({
  email: userEmail,
  // Sem as regras de tamanho do cadastro: no login só importa se a senha confere.
  password: z.string().min(1),
});

export type LoginUserInput = z.input<typeof loginUserInputSchema>;
