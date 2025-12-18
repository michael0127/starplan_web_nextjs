# Image Upload Structure

## 文件存储路径

所有上传的公司图片都存储在 Supabase Storage 中，路径结构如下：

### 路径格式
```
{bucket_name}/{userId}/{jobPostingId}/{type}-{timestamp}.{ext}
```

### 示例
```
company_logo/
  └── abc123-user-id/
      └── xyz789-job-posting-id/
          ├── logo-1703001234567.png
          └── logo-1703001345678.jpg

company_cover_image/
  └── abc123-user-id/
      └── xyz789-job-posting-id/
          ├── cover-1703001234567.png
          └── cover-1703001345678.jpg
```

## 存储桶 (Buckets)

- **company_logo**: 存储公司 Logo 图片
- **company_cover_image**: 存储公司封面图片

## 工作流程

### 1. 新建职位时上传图片

如果用户在创建职位时先上传图片：
- 首次上传时没有 `jobPostingId`（因为职位还未创建）
- 文件临时存储在 `{userId}/` 路径下
- 保存草稿后获得 `jobPostingId`
- 后续上传会存储在 `{userId}/{jobPostingId}/` 路径下

### 2. 编辑已有职位时上传图片

如果用户编辑已有职位：
- 从 URL 参数获取 `jobPostingId`
- 所有图片直接存储在 `{userId}/{jobPostingId}/` 路径下

## API 端点

### 上传图片
```typescript
POST /api/upload-image

FormData:
  - file: File (必需)
  - type: 'logo' | 'cover' (必需)
  - jobPostingId: string (可选)

Headers:
  - Authorization: Bearer {access_token}
```

### 删除图片
```typescript
DELETE /api/upload-image

Body:
  - url: string (必需)
  - type: 'logo' | 'cover' (必需)

Headers:
  - Authorization: Bearer {access_token}
```

## 安全性

- ✅ 服务器端验证：使用 service role key
- ✅ 认证检查：验证用户身份
- ✅ 权限检查：用户只能删除自己的文件
- ✅ 文件类型验证：只允许图片格式
- ✅ 文件大小限制：最大 5MB

## 优点

1. **组织清晰**：按用户和职位组织文件
2. **易于管理**：可以一次性删除某个职位的所有图片
3. **权限控制**：通过路径验证文件所有权
4. **可扩展**：便于未来添加更多功能








