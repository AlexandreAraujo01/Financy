import { z } from 'zod';

export const categoryId = z.uuid();
export const categoryName = z.string().trim().min(1).max(50);
