# Archive Feature Implementation

## ✅ 功能概述

为已支付的职位（PUBLISHED 状态）添加 Archive 功能，并新增 Archived 标签页来展示归档的职位。

## 🎯 需求

1. **移除 Delete 按钮**：对于 PUBLISHED 状态的职位，移除 Delete 按钮
2. **添加 Archive 按钮**：替换为 Archive 按钮
3. **新增 Archived 标签页**：在 All, Published, Drafts, Closed 之后添加 Archived 标签
4. **保持 Delete 按钮**：对于 DRAFT 和其他状态的职位，保留 Delete 按钮

## 📁 新增/修改文件

### 1. `/src/app/api/job-postings/[id]/archive/route.ts` (新增)

归档职位的 API 端点。

**功能：**
- 验证用户身份和职位所有权
- 只允许归档 PUBLISHED 或 CLOSED 状态的职位
- 将职位状态更新为 ARCHIVED

**请求：**
```typescript
PATCH /api/job-postings/[id]/archive
Headers: { Authorization: Bearer <token> }
```

**响应：**
```json
{
  "success": true,
  "message": "Job posting archived successfully",
  "data": { ...updatedJobPosting }
}
```

**错误处理：**
- 401: 未授权
- 403: 不是职位所有者
- 404: 职位不存在
- 400: 只能归档 PUBLISHED 或 CLOSED 的职位

### 2. `/src/app/employer/jobs/page.tsx` (修改)

职位列表页面，添加 Archive 功能。

**新增状态：**
```typescript
const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'closed' | 'archived'>('all');
const [archiveModalOpen, setArchiveModalOpen] = useState(false);
const [jobToArchive, setJobToArchive] = useState<{ id: string; title: string } | null>(null);
const [isArchiving, setIsArchiving] = useState(false);
```

**新增函数：**
```typescript
- openArchiveModal(id: string, title: string)
- closeArchiveModal()
- handleArchive()
```

**条件按钮渲染：**
```tsx
{job.status === 'PUBLISHED' ? (
  <button className={styles.btnWarning} onClick={() => openArchiveModal(job.id, job.jobTitle)}>
    Archive
  </button>
) : (
  <button className={styles.btnDanger} onClick={() => openDeleteModal(job.id, job.jobTitle)}>
    Delete
  </button>
)}
```

**新增标签页：**
```tsx
<button
  className={`${styles.tab} ${activeTab === 'archived' ? styles.tabActive : ''}`}
  onClick={() => setActiveTab('archived')}
>
  Archived
</button>
```

**Archive 确认弹窗：**
- 类似 Delete Modal，但使用橙色主题
- 提示用户归档操作可以恢复
- 显示归档图标

### 3. `/src/app/employer/jobs/page.module.css` (修改)

添加 Archive 相关样式。

**新增样式：**
```css
.btnWarning {
  /* 橙色边框按钮 */
  border: 1px solid #f59e0b;
  color: #f59e0b;
}

.btnWarning:hover {
  background: #f59e0b;
  color: white;
}

.btnModalArchive {
  /* 橙色实心按钮 */
  background: #f59e0b;
  color: white;
}

.btnModalArchive:hover {
  background: #d97706;
}
```

## 🔄 工作流程

### 归档流程

```
用户查看 Published 职位
    ↓
点击 "Archive" 按钮
    ↓
显示归档确认弹窗
    ↓
用户确认
    ↓
调用 PATCH /api/job-postings/[id]/archive
    ↓
验证用户身份和所有权
    ↓
检查职位状态（必须是 PUBLISHED 或 CLOSED）
    ↓
更新状态为 ARCHIVED
    ↓
关闭弹窗，刷新列表
    ↓
职位出现在 Archived 标签页
```

### 标签页状态

| 标签 | 显示状态 | 按钮 |
|------|---------|------|
| All | 所有职位 | 条件显示 |
| Published | PUBLISHED | Archive |
| Drafts | DRAFT | Delete |
| Closed | CLOSED | Delete |
| Archived | ARCHIVED | Delete |

## 🎨 用户界面

### 职位卡片 - Published 状态

```
┌─────────────────────────────────────┐
│ Senior Software Engineer            │
│ [Published] Badge                   │
│                                     │
│ Tech Corp • Remote • Full-time     │
│                                     │
│ Categories: Frontend, React        │
│                                     │
│ Job summary text...                │
│                                     │
│ [Edit] [Archive]                   │ ← Archive 按钮（橙色）
└─────────────────────────────────────┘
```

### 职位卡片 - Draft 状态

```
┌─────────────────────────────────────┐
│ Junior Developer                    │
│ [Draft] Badge                       │
│                                     │
│ Startup Inc • Sydney • Part-time   │
│                                     │
│ Job summary text...                │
│                                     │
│ [Continue Editing] [Delete]        │ ← Delete 按钮（红色）
└─────────────────────────────────────┘
```

### Archive 确认弹窗

```
┌─────────────────────────────────────┐
│ Archive Job Posting            [×] │
│                                     │
│      📦 Archive Icon (Orange)       │
│                                     │
│  Archive "Senior Software Engineer"?│
│                                     │
│  This will remove the job posting  │
│  from active listings. You can     │
│  still view it in the Archived tab.│
│  This action can be reversed.      │
│                                     │
│     [Cancel]  [Archive Job]        │
│              (Orange button)        │
└─────────────────────────────────────┘
```

### 标签页

```
┌───────────────────────────────────────────────┐
│ [All] [Published] [Drafts] [Closed] [Archived]│
│   ✓                                       ✓    │
└───────────────────────────────────────────────┘
```

## 🔐 权限和验证

### API 验证

1. **身份验证**
   ```typescript
   const authHeader = request.headers.get('authorization');
   if (!authHeader) return 401;
   ```

2. **所有权验证**
   ```typescript
   if (jobPosting.userId !== user.id) return 403;
   ```

3. **状态验证**
   ```typescript
   if (status !== 'PUBLISHED' && status !== 'CLOSED') return 400;
   ```

### 前端保护

- 只对 PUBLISHED 状态显示 Archive 按钮
- 其他状态显示 Delete 按钮
- 按钮禁用状态处理

## 📊 数据库查询

### 获取归档职位

```typescript
// URL: /api/job-postings?status=ARCHIVED
const archivedJobs = await prisma.jobPosting.findMany({
  where: {
    userId: user.id,
    status: 'ARCHIVED'
  },
  orderBy: { updatedAt: 'desc' }
});
```

### 归档职位

```typescript
await prisma.jobPosting.update({
  where: { id: jobPostingId },
  data: { status: 'ARCHIVED' }
});
```

## 🧪 测试场景

### 测试 1: 归档 Published 职位

```bash
1. 创建并支付职位
2. 职位状态变为 PUBLISHED
3. 在 Published 标签页查看
4. ✅ 验证显示 [Archive] 按钮，没有 [Delete] 按钮
5. 点击 [Archive]
6. ✅ 验证显示归档确认弹窗
7. 点击 [Archive Job]
8. ✅ 验证职位从 Published 列表消失
9. 切换到 Archived 标签页
10. ✅ 验证职位出现在 Archived 列表
11. ✅ 验证职位状态为 ARCHIVED
```

### 测试 2: Draft 职位保留 Delete 按钮

```bash
1. 创建草稿职位
2. 在 Drafts 标签页查看
3. ✅ 验证显示 [Delete] 按钮，没有 [Archive] 按钮
4. ✅ 验证可以正常删除
```

### 测试 3: 尝试归档 Draft 职位（应失败）

```bash
1. 获取 DRAFT 职位的 ID
2. 调用 PATCH /api/job-postings/[id]/archive
3. ✅ 验证返回 400 错误
4. ✅ 验证错误消息："Only published or closed jobs can be archived"
```

### 测试 4: Archived 标签页

```bash
1. 归档多个职位
2. 点击 Archived 标签
3. ✅ 验证显示所有归档的职位
4. ✅ 验证每个职位都有 ARCHIVED badge
5. ✅ 验证可以编辑归档的职位
6. ✅ 验证归档职位有 [Delete] 按钮
```

### 测试 5: 权限验证

```bash
1. 用户 A 创建并发布职位
2. 用户 B 尝试归档用户 A 的职位
3. ✅ 验证返回 403 Forbidden
```

## 🎨 颜色主题

### Delete (红色)
- Border: `#dc2626`
- Background Hover: `#dc2626`
- Modal Button: `#dc2626`
- Modal Button Hover: `#b91c1c`

### Archive (橙色)
- Border: `#f59e0b`
- Background Hover: `#f59e0b`
- Modal Button: `#f59e0b`
- Modal Button Hover: `#d97706`

### Status Badges
```css
.statusPublished { background: #10b981; }
.statusDraft { background: #94a3b8; }
.statusClosed { background: #64748b; }
.statusArchived { background: #f59e0b; }
```

## 🔄 与自动归档的关系

### 手动归档
- 雇主主动点击 Archive 按钮
- 立即生效
- 可用于任何 PUBLISHED 或 CLOSED 职位

### 自动归档（Cron Job）
- 每天自动运行
- 归档过期的职位（`expires_at < NOW()`）
- 只处理 PUBLISHED 状态的职位

### 区别

| 特性 | 手动归档 | 自动归档 |
|------|---------|---------|
| 触发方式 | 用户点击 | Cron Job |
| 触发时间 | 立即 | 每天凌晨 |
| 适用状态 | PUBLISHED, CLOSED | PUBLISHED |
| 条件 | 无 | expires_at < NOW() |

## ✨ 用户体验优化

### 1. 清晰的视觉区分
- Delete 使用红色（危险操作）
- Archive 使用橙色（中性操作）

### 2. 友好的提示文案
- Archive: "This action can be reversed"（可以恢复）
- Delete: "This action cannot be undone"（不可恢复）

### 3. 图标语义化
- Delete: ⚠️ 警告三角形
- Archive: 📦 归档箱

### 4. 操作反馈
- 加载状态："Archiving..."
- 成功后刷新列表
- Modal 自动关闭

## 🚀 部署清单

- [x] 创建 Archive API route
- [x] 更新职位列表页面
- [x] 添加 Archived 标签页
- [x] 条件渲染 Archive/Delete 按钮
- [x] 添加 Archive Modal
- [x] 添加 CSS 样式
- [x] 编写文档

### 测试清单

- [ ] 测试归档 Published 职位
- [ ] 测试 Draft 职位保留 Delete
- [ ] 测试 Archived 标签页显示
- [ ] 测试权限验证
- [ ] 测试 API 错误处理
- [ ] 测试 UI 响应式布局

### 生产环境

- [ ] 代码审查
- [ ] 部署到测试环境
- [ ] 执行完整测试
- [ ] 部署到生产环境
- [ ] 监控错误日志

## 📝 API 文档

### Archive Job Posting

**Endpoint:** `PATCH /api/job-postings/:id/archive`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Job posting archived successfully",
  "data": {
    "id": "uuid",
    "status": "ARCHIVED",
    "updatedAt": "2024-01-15T10:30:00Z",
    ...
  }
}
```

**Response (Error):**
```json
{
  "error": "Only published or closed jobs can be archived"
}
```

**Status Codes:**
- 200: Success
- 400: Bad Request (invalid status)
- 401: Unauthorized
- 403: Forbidden (not owner)
- 404: Not Found
- 500: Internal Server Error

## 🎉 总结

Archive 功能已完整实现：

- ✅ Published 职位显示 Archive 按钮
- ✅ Draft 和其他状态保留 Delete 按钮
- ✅ 新增 Archived 标签页
- ✅ Archive API 端点
- ✅ 归档确认弹窗
- ✅ 完整的权限验证
- ✅ 友好的用户界面

现在雇主可以：
1. 归档已支付的职位
2. 在 Archived 标签查看归档职位
3. 保持数据完整性（归档而不是删除）
4. 必要时可以恢复归档的职位
