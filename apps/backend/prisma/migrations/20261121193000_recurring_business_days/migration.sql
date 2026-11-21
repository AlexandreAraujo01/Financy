-- Recorrências existentes mantêm o dia fixo e as datas já calculadas.
CREATE TYPE "recurring_day_type" AS ENUM ('calendar_day', 'business_day');

ALTER TABLE "recurring_transactions"
  ADD COLUMN "day_type" "recurring_day_type" NOT NULL DEFAULT 'calendar_day';

ALTER TABLE "recurring_transactions"
  ADD CONSTRAINT "recurring_transactions_business_day_check"
  CHECK ("day_type" <> 'business_day' OR "day_of_month" BETWEEN 1 AND 23);
