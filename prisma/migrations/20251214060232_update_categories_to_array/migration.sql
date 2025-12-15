/*
  Warnings:

  - You are about to drop the column `category` on the `job_postings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job_postings" DROP COLUMN "category",
ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];
