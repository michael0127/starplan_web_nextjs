-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('ANNUAL_SALARY', 'HOURLY_RATE', 'DAILY_RATE', 'PROJECT_BASED');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('INTERN', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'PRINCIPAL');

-- CreateTable
CREATE TABLE "job_postings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "job_title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "category_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_category_manually_selected" BOOLEAN NOT NULL DEFAULT false,
    "country_region" TEXT NOT NULL,
    "experience_level" TEXT NOT NULL,
    "experience_years_from" INTEGER NOT NULL,
    "experience_years_to" TEXT NOT NULL,
    "work_type" TEXT NOT NULL,
    "pay_type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "pay_from" TEXT NOT NULL,
    "pay_to" TEXT NOT NULL,
    "show_salary_on_ad" BOOLEAN NOT NULL DEFAULT true,
    "salary_display_text" TEXT,
    "company_name" TEXT NOT NULL,
    "job_description" TEXT NOT NULL,
    "job_summary" TEXT NOT NULL,
    "key_selling_point_1" TEXT,
    "key_selling_point_2" TEXT,
    "key_selling_point_3" TEXT,
    "company_logo" TEXT,
    "company_cover_image" TEXT,
    "video_link" TEXT,
    "selected_countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "work_auth_by_country" JSONB,
    "application_deadline" TIMESTAMP(3),

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_screening_answers" (
    "id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "question_id" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "selected_answers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_screening_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_screening_questions" (
    "id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_type" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "must_answer" BOOLEAN NOT NULL DEFAULT false,
    "ideal_answer" JSONB,
    "disqualify_if_not_ideal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_screening_questions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_screening_answers" ADD CONSTRAINT "system_screening_answers_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_screening_questions" ADD CONSTRAINT "custom_screening_questions_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
