export abstract class Repository<T, Props> {
  abstract create(data: T): Promise<T>;

  abstract find(id: string): Promise<T | null>;

  abstract delete(id: string): Promise<T | null>;

  abstract update(data: Partial<Props>, id: string): Promise<T | null>;
}
