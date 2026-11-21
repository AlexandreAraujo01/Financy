import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from './generated/client';

export function createPrismaClient(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

// P2025: o registro que o update/delete procurava não existe.
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return violatedConstraint(error, 'P2002') === constraint;
}

export function isForeignKeyViolation(error: unknown, constraint: string): boolean {
  return violatedConstraint(error, 'P2003') === constraint;
}

// Com o adapter do pg, o nome da constraint violada vem dentro de meta.driverAdapterError.
function violatedConstraint(error: unknown, code: string): string | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== code) {
    return undefined;
  }
  const meta = error.meta as
    | { driverAdapterError?: { cause?: { constraint?: { index?: string } } } }
    | undefined;
  return meta?.driverAdapterError?.cause?.constraint?.index;
}
