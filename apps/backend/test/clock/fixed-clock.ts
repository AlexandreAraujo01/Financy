import { Clock } from '@/ports/clock';

// Relógio parado num dia, pros testes de recorrência não dependerem da data de hoje.
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  set(date: Date) {
    this.current = date;
  }
}
