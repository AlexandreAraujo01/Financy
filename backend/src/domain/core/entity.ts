import { uuidv7 } from 'uuidv7';

export abstract class Entity<T> {
  private readonly _id: string;
  private readonly _createdAt: Date;
  protected props: T;

  protected constructor(data: T, id?: string, createdAt?: Date) {
    this.props = data;
    this._id = id ?? uuidv7();
    this._createdAt = createdAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  public toSnapshot(): T & { id: string; createdAt: Date } {
    return {
      ...this.props,
      id: this._id,
      createdAt: this._createdAt,
    };
  }
}
