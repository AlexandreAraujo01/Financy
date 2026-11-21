import { describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { Category } from '../category';

const props = { userId: uuidv7(), name: 'Mercado', status: 'active' as const };

describe('Category unit test', () => {
  it('should trim the name', () => {
    const category = Category.create({ ...props, name: '  Mercado  ' });

    expect(category.toSnapshot().name).toBe('Mercado');
  });

  it('should be active only when the status is active', () => {
    expect(Category.create(props).isActive).toBe(true);
    expect(Category.create({ ...props, status: 'deleted' }).isActive).toBe(false);
  });
});
