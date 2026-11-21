import { Entity } from '@/domain/core/entity';
import { Repository } from '@/ports/repository';

export abstract class InMemoryRepository<
  T extends Entity<Props>,
  Props,
> extends Repository<T, Props> {
  public items = new Map<string, T>();

  // Recria a entidade a partir das props, já que elas são protegidas.
  protected abstract build(props: Props, id: string, createdAt: Date): T;

  create(data: T): Promise<T> {
    this.items.set(data.id, data);
    return Promise.resolve(data);
  }

  find(id: string): Promise<T | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  delete(id: string): Promise<T | null> {
    const item = this.items.get(id) ?? null;
    this.items.delete(id);
    return Promise.resolve(item);
  }

  update(data: Partial<Props>, id: string): Promise<T | null> {
    const current = this.items.get(id);
    if (!current) return Promise.resolve(null);

    const { id: _id, createdAt, ...props } = current.toSnapshot();
    const updated = this.build({ ...(props as Props), ...data }, id, createdAt);
    this.items.set(id, updated);
    return Promise.resolve(updated);
  }
}
