import { z } from 'zod';
import { userEmail, userName, userPassword } from './user-fields';

export const createUserInputSchema = z.object({
  name: userName,
  email: userEmail,
  password: userPassword,
});

export type CreateUserInput = z.input<typeof createUserInputSchema>;
