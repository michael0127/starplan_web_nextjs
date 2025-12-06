-- =====================================================
-- Supabase Auth 自动同步触发器
-- =====================================================
-- 这个脚本会创建触发器，自动将 auth.users 的变化同步到 public.users 表
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 创建函数：处理新用户注册
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value TEXT;
BEGIN
  -- 从 raw_user_meta_data 中获取 user_type，如果没有则默认为 'CANDIDATE'
  user_type_value := COALESCE(new.raw_user_meta_data->>'user_type', 'CANDIDATE');
  
  INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    user_type_value::public."UserType",
    now(),
    now()
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- 如果用户已存在，更新记录
    UPDATE public.users
    SET email = new.email,
        name = new.raw_user_meta_data->>'name',
        user_type = user_type_value::public."UserType",
        updated_at = now()
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建触发器：在 auth.users 插入新记录时自动执行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 创建函数：处理用户更新
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value TEXT;
BEGIN
  user_type_value := COALESCE(new.raw_user_meta_data->>'user_type', 'CANDIDATE');
  
  UPDATE public.users
  SET email = new.email,
      name = new.raw_user_meta_data->>'name',
      user_type = user_type_value::public."UserType",
      updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建触发器：在 auth.users 更新时同步
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 5. 创建函数：处理用户删除
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建触发器：删除用户时同步删除
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- =====================================================
-- 可选：同步现有用户
-- =====================================================
-- 如果你已经有一些 auth.users 记录，运行这个来同步现有用户
-- 注意：这会跳过已存在的用户

INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name',
  COALESCE((raw_user_meta_data->>'user_type')::public."UserType", 'CANDIDATE'::public."UserType"),
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 验证触发器是否正常工作
-- =====================================================
-- 运行以下查询来检查触发器状态：
-- SELECT * FROM pg_trigger WHERE tgname LIKE 'on_auth_user%';








