import { z } from 'zod';
import { userEmail, userId, userName } from './user-fields';

export const updateUserInputSchema = z.object({
  userId,
  // null vem do GraphQL quando o campo é enviado vazio; null não altera nada.
  name: userName.nullish(),
  email: userEmail.nullish(),
});

export type UpdateUserInput = z.input<typeof updateUserInputSchema>;
