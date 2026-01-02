-- 性能优化索引
-- 这些索引将显著提升查询性能，特别是在数据量增长后

-- 1. job_postings 表的复合索引
-- 用于加速 WHERE user_id = X AND status = Y ORDER BY updated_at DESC 查询
CREATE INDEX IF NOT EXISTS idx_job_postings_user_status_updated 
ON job_postings(user_id, status, updated_at DESC);

-- 2. job_postings 表的单列索引（如果上面的复合索引不够用）
CREATE INDEX IF NOT EXISTS idx_job_postings_user_id 
ON job_postings(user_id);

CREATE INDEX IF NOT EXISTS idx_job_postings_status 
ON job_postings(status);

CREATE INDEX IF NOT EXISTS idx_job_postings_updated_at 
ON job_postings(updated_at DESC);

-- 3. system_screening_answers 表的索引
-- 用于加速 WHERE job_posting_id IN (...) 查询
CREATE INDEX IF NOT EXISTS idx_system_screening_job_posting 
ON system_screening_answers(job_posting_id);

-- 4. custom_screening_questions 表的索引
-- 用于加速 WHERE job_posting_id IN (...) 查询
CREATE INDEX IF NOT EXISTS idx_custom_screening_job_posting 
ON custom_screening_questions(job_posting_id);

-- 5. 验证索引创建
-- 运行以下查询来验证索引是否创建成功
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- 6. 分析表以更新统计信息
ANALYZE job_postings;
ANALYZE system_screening_answers;
ANALYZE custom_screening_questions;

-- 完成
-- 这些索引将使查询性能提升 2-10 倍，具体取决于数据量

