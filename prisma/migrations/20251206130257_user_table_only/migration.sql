/*
  Warnings:

  - You are about to drop the column `candidate_id` on the `cvs` table. All the data in the column will be lost.
  - You are about to drop the column `employer_id` on the `job_descriptions` table. All the data in the column will be lost.
  - You are about to drop the `candidate_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employer_users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `cvs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `job_descriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CANDIDATE', 'EMPLOYER');

-- DropForeignKey
ALTER TABLE "cvs" DROP CONSTRAINT "cvs_candidate_id_fkey";

-- DropForeignKey
ALTER TABLE "job_descriptions" DROP CONSTRAINT "job_descriptions_employer_id_fkey";

-- AlterTable
ALTER TABLE "cvs" DROP COLUMN "candidate_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "job_descriptions" DROP COLUMN "employer_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- DropTable
DROP TABLE "candidate_users";

-- DropTable
DROP TABLE "employer_users";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "user_type" "UserType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
