# Admin Portal

## 概述

StarPlan Admin Portal 是一个管理后台系统，用于监控和管理平台的关键数据和指标。

## 功能特性

### 🔐 安全认证
- 基于 JWT 的身份验证
- Token 有效期：24小时
- 安全的密码验证

### 📊 Dashboard 统计
管理员可以查看以下实时数据：
- **总用户数**：平台注册用户总数
- **求职者数量**：CANDIDATE 类型用户数
- **雇主数量**：EMPLOYER 类型用户数
- **职位发布总数**：所有状态的职位数量
- **已发布职位**：PUBLISHED 状态的职位
- **草稿职位**：DRAFT 状态的职位
- **总匹配数**：候选人与职位的匹配记录数
- **系统状态**：当前系统运行状态

### 📋 数据列表
- **最近用户**：最新注册的 10 个用户
  - 邮箱
  - 姓名
  - 用户类型（Candidate/Employer）
  - 创建时间
  
- **最近职位**：最新创建的 10 个职位发布
  - 职位标题
  - 公司名称
  - 状态（Published/Draft/Closed）
  - 创建时间

## 登录凭据

```
用户名: admin
密码: admin
```

⚠️ **重要提示**：在生产环境中，请务必修改默认密码并使用环境变量配置 JWT_SECRET。

## 访问方式

### 本地开发环境
```
http://localhost:3000/admin/login
```

### 生产环境
```
https://yourdomain.com/admin/login
```

## 页面路由

| 路由 | 说明 |
|------|------|
| `/admin` | 重定向到登录页 |
| `/admin/login` | 管理员登录页面 |
| `/admin/dashboard` | 管理员仪表板（需要认证） |

## 技术实现

### 前端技术
- **框架**：Next.js 16 (App Router)
- **样式**：CSS Modules
- **图标**：自定义 SVG 组件
- **状态管理**：React Hooks (useState, useEffect)
- **本地存储**：localStorage (存储 JWT token)

### 后端 API
- **认证接口**：`/api/admin/auth`
  - POST：验证管理员凭据，返回 JWT token
  
- **Dashboard 接口**：`/api/admin/dashboard`
  - GET：获取仪表板数据（需要 Bearer token）

### 数据库
- **ORM**：Prisma
- **数据库**：PostgreSQL
- **查询优化**：使用 `Promise.all()` 并行执行多个查询

### 安全措施
1. **JWT 认证**：所有 dashboard API 请求需要有效的 JWT token
2. **Token 验证**：服务端验证 token 签名和有效期
3. **自动登出**：token 过期或无效时自动重定向到登录页
4. **密码保护**：不在代码中硬编码敏感信息（建议使用环境变量）

## 环境变量配置

在 `.env` 文件中添加：

```env
# JWT Secret (生产环境必须修改)
JWT_SECRET=your-super-secret-jwt-key-here

# Database URL (Prisma)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

## 安全建议

### 生产环境部署前

1. **修改默认密码**
   编辑 `src/app/api/admin/auth/route.ts`：
   ```typescript
   const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
   const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
   ```

2. **配置强密码 JWT Secret**
   ```bash
   # 生成随机密钥
   openssl rand -base64 32
   ```

3. **添加 IP 白名单**（可选）
   在 API 路由中添加 IP 验证逻辑

4. **启用 HTTPS**
   确保生产环境使用 SSL/TLS 加密

5. **添加速率限制**
   防止暴力破解攻击

6. **日志记录**
   记录所有管理员登录和操作日志

## 自定义 SVG 图标

所有图标都是自定义的 SVG 组件，位于 `src/components/admin/AdminIcons.tsx`：

- `UsersIcon` - 总用户
- `CandidateIcon` - 求职者
- `BuildingIcon` - 雇主/公司
- `BriefcaseIcon` - 职位发布
- `CheckCircleIcon` - 已发布
- `FileTextIcon` - 草稿
- `HandshakeIcon` - 匹配
- `ActivityIcon` - 系统状态

所有图标使用简约的线条风格，颜色通过 `currentColor` 继承，便于主题定制。

## 开发说明

### 启动开发服务器
```bash
cd starplan_web_nextjs
npm run dev
```

### 构建生产版本
```bash
npm run build
npm start
```

### 添加新的统计指标

1. 在 `src/app/api/admin/dashboard/route.ts` 添加 Prisma 查询
2. 在 `src/app/admin/dashboard/page.tsx` 的 `DashboardStats` 接口添加类型
3. 在 dashboard 页面添加新的统计卡片
4. 如需新图标，在 `AdminIcons.tsx` 中创建

## 故障排除

### Token 无效或过期
- 症状：自动跳转到登录页
- 解决：重新登录获取新 token

### Dashboard 数据加载失败
- 检查数据库连接
- 检查 Prisma Client 是否正确初始化
- 查看服务端日志

### 样式显示异常
- 清除浏览器缓存
- 检查 CSS Modules 是否正确导入

## 维护和更新

定期检查和更新：
- 依赖包版本
- 安全漏洞（运行 `npm audit`）
- JWT token 过期策略
- 数据库索引优化

## 联系支持

如有问题或建议，请联系开发团队。

