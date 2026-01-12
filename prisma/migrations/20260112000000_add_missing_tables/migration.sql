-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('JUNIOR', 'SENIOR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_logo" TEXT,
    "company_cover_image" TEXT,
    "video_link" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "description" TEXT,
    "location" TEXT,
    "founded_year" INTEGER,
    "linkedin_url" TEXT,
    "twitter_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "job_posting_purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_posting_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "stripe_product_id" TEXT NOT NULL,
    "stripe_price_id" TEXT NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_customer_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_session_id" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'aud',
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "job_posting_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_posting_purchases_job_posting_id_key" ON "job_posting_purchases"("job_posting_id");

-- CreateIndex
CREATE INDEX "job_posting_purchases_user_id_idx" ON "job_posting_purchases"("user_id");

-- CreateIndex
CREATE INDEX "job_posting_purchases_payment_status_idx" ON "job_posting_purchases"("payment_status");

-- CreateIndex
CREATE INDEX "job_posting_purchases_stripe_payment_intent_id_idx" ON "job_posting_purchases"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "job_posting_purchases_stripe_customer_id_idx" ON "job_posting_purchases"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "job_posting_purchases_expires_at_idx" ON "job_posting_purchases"("expires_at");

-- AddForeignKey
ALTER TABLE "job_posting_purchases" ADD CONSTRAINT "job_posting_purchases_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "candidate_job_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "cv_id" UUID,
    "passed_hard_gate" BOOLEAN NOT NULL DEFAULT false,
    "hard_gate_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "match_details" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "candidate_viewed" BOOLEAN NOT NULL DEFAULT false,
    "employer_viewed" BOOLEAN NOT NULL DEFAULT false,
    "candidate_interested" BOOLEAN NOT NULL DEFAULT false,
    "employer_interested" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_job_matches_candidate_id_job_posting_id_key" ON "candidate_job_matches"("candidate_id", "job_posting_id");

-- CreateIndex
CREATE INDEX "candidate_job_matches_candidate_id_idx" ON "candidate_job_matches"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_job_matches_job_posting_id_idx" ON "candidate_job_matches"("job_posting_id");

-- CreateIndex
CREATE INDEX "candidate_job_matches_passed_hard_gate_idx" ON "candidate_job_matches"("passed_hard_gate");

-- CreateIndex
CREATE INDEX "candidate_job_matches_is_active_idx" ON "candidate_job_matches"("is_active");

-- CreateIndex
CREATE INDEX "candidate_job_matches_created_at_idx" ON "candidate_job_matches"("created_at");

-- AddForeignKey
ALTER TABLE "candidate_job_matches" ADD CONSTRAINT "candidate_job_matches_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_job_matches" ADD CONSTRAINT "candidate_job_matches_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_job_matches" ADD CONSTRAINT "candidate_job_matches_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "email_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "cc_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'SENT',
    "resend_id" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_records_sender_id_idx" ON "email_records"("sender_id");

-- CreateIndex
CREATE INDEX "email_records_recipient_id_idx" ON "email_records"("recipient_id");

-- CreateIndex
CREATE INDEX "email_records_recipient_email_idx" ON "email_records"("recipient_email");

-- CreateIndex
CREATE INDEX "email_records_status_idx" ON "email_records"("status");

-- CreateIndex
CREATE INDEX "email_records_sent_at_idx" ON "email_records"("sent_at");

-- CreateTable (if not exists for candidate_rankings - migration was marked applied but table may not exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'candidate_rankings') THEN
        CREATE TABLE "candidate_rankings" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "job_posting_id" UUID NOT NULL,
            "ranked_candidates" JSONB NOT NULL,
            "candidate_hash" TEXT NOT NULL,
            "total_candidates" INTEGER NOT NULL,
            "total_comparisons" INTEGER NOT NULL,
            "total_input_tokens" INTEGER NOT NULL DEFAULT 0,
            "total_output_tokens" INTEGER NOT NULL DEFAULT 0,
            "total_tokens" INTEGER NOT NULL DEFAULT 0,
            "input_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "output_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "candidate_rankings_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX "candidate_rankings_job_posting_id_key" ON "candidate_rankings"("job_posting_id");
        CREATE INDEX "candidate_rankings_job_posting_id_idx" ON "candidate_rankings"("job_posting_id");
        CREATE INDEX "candidate_rankings_candidate_hash_idx" ON "candidate_rankings"("candidate_hash");
        ALTER TABLE "candidate_rankings" ADD CONSTRAINT "candidate_rankings_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
