-- AlterTable
ALTER TABLE "users" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "category_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currency" TEXT DEFAULT 'aud',
ADD COLUMN     "experience_level" TEXT,
ADD COLUMN     "experience_years_from" INTEGER,
ADD COLUMN     "experience_years_to" TEXT,
ADD COLUMN     "pay_type" TEXT,
ADD COLUMN     "salary_expectation_from" TEXT,
ADD COLUMN     "salary_expectation_to" TEXT,
ADD COLUMN     "work_auth_by_country" JSONB,
ADD COLUMN     "work_auth_countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "work_types" TEXT[] DEFAULT ARRAY[]::TEXT[];

