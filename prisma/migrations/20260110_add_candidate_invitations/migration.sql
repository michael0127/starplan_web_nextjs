-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'VIEWED', 'COMPLETED', 'EXPIRED', 'DECLINED');

-- CreateTable
CREATE TABLE "candidate_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "job_posting_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "candidate_email" TEXT NOT NULL,
    "candidate_name" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_screening_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invitation_id" UUID NOT NULL,
    "question_type" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_type" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_screening_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_invitations_token_key" ON "candidate_invitations"("token");

-- CreateIndex
CREATE INDEX "candidate_invitations_job_posting_id_idx" ON "candidate_invitations"("job_posting_id");

-- CreateIndex
CREATE INDEX "candidate_invitations_candidate_id_idx" ON "candidate_invitations"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_invitations_token_idx" ON "candidate_invitations"("token");

-- CreateIndex
CREATE INDEX "candidate_invitations_status_idx" ON "candidate_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_invitations_job_posting_id_candidate_id_key" ON "candidate_invitations"("job_posting_id", "candidate_id");

-- CreateIndex
CREATE INDEX "candidate_screening_responses_invitation_id_idx" ON "candidate_screening_responses"("invitation_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_screening_responses_invitation_id_question_type_q_key" ON "candidate_screening_responses"("invitation_id", "question_type", "question_id");

-- AddForeignKey
ALTER TABLE "candidate_invitations" ADD CONSTRAINT "candidate_invitations_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_screening_responses" ADD CONSTRAINT "candidate_screening_responses_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "candidate_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
