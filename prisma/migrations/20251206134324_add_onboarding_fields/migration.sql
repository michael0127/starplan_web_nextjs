-- AlterTable
ALTER TABLE "users" ADD COLUMN     "h1b_sponsorship" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "job_function" TEXT,
ADD COLUMN     "job_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "preferred_location" TEXT,
ADD COLUMN     "remote_open" BOOLEAN NOT NULL DEFAULT false;
