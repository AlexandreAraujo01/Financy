import { describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { Category } from '../category';

const props = {
  userId: uuidv7(),
  name: 'Mercado',
  description: null,
  icon: 'shopping_cart' as const,
  color: 'orange' as const,
  status: 'active' as const,
};

describe('Category unit test', () => {
  it('should trim the name', () => {
    const category = Category.create({ ...props, name: '  Mercado  ' });

    expect(category.toSnapshot().name).toBe('Mercado');
  });

  it('should be active only when the status is active', () => {
    expect(Category.create(props).isActive).toBe(true);
    expect(Category.create({ ...props, status: 'deleted' }).isActive).toBe(false);
  });

  it('should trim the description and store an empty one as null', () => {
    expect(Category.create({ ...props, description: '  Compras  ' }).toSnapshot().description).toBe(
      'Compras',
    );
    expect(Category.create({ ...props, description: '   ' }).toSnapshot().description).toBeNull();
  });
});
