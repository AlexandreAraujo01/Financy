-- CreateEnum
CREATE TYPE "category_status" AS ENUM ('active', 'deleted');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('active', 'deleted');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "category_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type" "transaction_type" NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "value_in_cents" INTEGER NOT NULL,
    "status" "transaction_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_id_user_id_unique" ON "categories"("id", "user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_user_id_fkey" FOREIGN KEY ("category_id", "user_id") REFERENCES "categories"("id", "user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
