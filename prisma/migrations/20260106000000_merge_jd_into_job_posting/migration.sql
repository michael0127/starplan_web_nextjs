-- 将 JobDescription 表合并到 JobPosting 表

-- 1. 在 job_postings 表中添加 JD 相关字段
ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "jd_file_url" TEXT;
ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "jd_extracted_data" JSONB;

-- 2. 删除 job_descriptions 表（如果存在数据需要先迁移）
-- 注意：如果需要保留数据，应该先手动迁移数据
DROP TABLE IF EXISTS "job_descriptions";

