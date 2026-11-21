/*
  Warnings:

  - Added the required column `color` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "category_icon" AS ENUM ('briefcase_business', 'car_front', 'heart_pulse', 'piggy_bank', 'shopping_cart', 'ticket', 'tool_case', 'utensils', 'paw_print', 'house', 'gift', 'dumbbell', 'book_open', 'baggage_claim', 'mailbox', 'receipt_text');

-- CreateEnum
CREATE TYPE "category_color" AS ENUM ('green', 'blue', 'purple', 'pink', 'red', 'orange', 'yellow');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "color" "category_color" NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" "category_icon" NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "description" TEXT NOT NULL;
