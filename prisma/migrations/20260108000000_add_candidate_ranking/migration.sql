-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "candidate_rankings_job_posting_id_key" ON "candidate_rankings"("job_posting_id");

-- CreateIndex
CREATE INDEX "candidate_rankings_job_posting_id_idx" ON "candidate_rankings"("job_posting_id");

-- CreateIndex
CREATE INDEX "candidate_rankings_candidate_hash_idx" ON "candidate_rankings"("candidate_hash");

-- AddForeignKey
ALTER TABLE "candidate_rankings" ADD CONSTRAINT "candidate_rankings_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
