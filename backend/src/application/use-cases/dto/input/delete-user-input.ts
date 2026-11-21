import { z } from 'zod';
import { userId } from './user-fields';

export const deleteUserInputSchema = z.object({ userId });

export type DeleteUserInput = z.input<typeof deleteUserInputSchema>;
