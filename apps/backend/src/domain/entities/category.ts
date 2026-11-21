import { Entity } from '@/domain/core/entity';
import { ICategory } from './props/category/category';

export class Category extends Entity<ICategory> {
  protected constructor(data: ICategory, id?: string, createdAt?: Date) {
    super(data, id, createdAt);
  }

  static create(data: ICategory, id?: string, createdAt?: Date) {
    return new Category({ ...data, name: data.name.trim() }, id, createdAt);
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }
}
