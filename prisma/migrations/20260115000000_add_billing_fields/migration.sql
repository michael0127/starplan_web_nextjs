-- Add billing fields to companies table
ALTER TABLE "companies" ADD COLUMN "billing_address" TEXT;
ALTER TABLE "companies" ADD COLUMN "billing_email" TEXT;
ALTER TABLE "companies" ADD COLUMN "billing_email_same_as_registration" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "companies" ADD COLUMN "abn" TEXT;
