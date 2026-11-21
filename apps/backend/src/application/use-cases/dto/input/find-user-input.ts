import { z } from 'zod';
import { userId } from './user-fields';

export const findUserInputSchema = z.object({ userId });

export type FindUserInput = z.input<typeof findUserInputSchema>;
