-- CreateEnum
CREATE TYPE "recurring_transaction_status" AS ENUM ('active', 'ended');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "recurring_transaction_id" UUID;

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "type" "transaction_type" NOT NULL,
    "value_in_cents" INTEGER NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "start_date" TIMESTAMPTZ(3) NOT NULL,
    "next_due_date" TIMESTAMPTZ(3) NOT NULL,
    "status" "recurring_transaction_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_transactions_user_id_status_idx" ON "recurring_transactions"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_recurring_transaction_id_date_unique" ON "transactions"("recurring_transaction_id", "date");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_transaction_id_fkey" FOREIGN KEY ("recurring_transaction_id") REFERENCES "recurring_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_user_id_fkey" FOREIGN KEY ("category_id", "user_id") REFERENCES "categories"("id", "user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- Dia do mês válido também no banco (o Prisma não modela CHECK, mas preserva).
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_day_of_month_check" CHECK ("day_of_month" BETWEEN 1 AND 31);
