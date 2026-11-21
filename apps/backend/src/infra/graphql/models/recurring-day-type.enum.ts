import { registerEnumType } from 'type-graphql';
import { RECURRING_DAY_TYPES, type RecurringDayType } from '@/domain/entities/props/recurring-transaction/recurring-transaction';

export const RecurringDayTypeEnum = Object.fromEntries(
  RECURRING_DAY_TYPES.map(type => [type, type]),
) as { [K in RecurringDayType]: K };

registerEnumType(RecurringDayTypeEnum, { name: 'RecurringDayType' });
