# Atom 尝鲜 · AI 应用编辑器工作台

「Atom 尝鲜」是一个全屏 AI 应用编辑器工作台：用一句话描述想法，即可生成可运行、可交互的小应用，并在三栏工作台中完成预览、改需求、看代码、版本管理与云端同步。

## 核心功能

- **创建页**：品牌引导、大输入框、示例需求（首条为「2048 小游戏」）、最近项目列表与空状态。
- **三栏工作台**：左侧导航（220px，项目列表 + 登录区）、中间需求面板（340px，需求沟通记录与输入发送）、右侧预览工作区（自适应）。
- **规则式应用生成器**：根据需求关键词识别类型并生成完整可独立运行的 HTML/CSS/JS 应用，覆盖 2048 小游戏、待办清单、番茄专注、习惯打卡、倒计时、计算器、投票、记账、通用记录等；未命中时生成自定义应用。
- **2048 小游戏**：键盘方向键 + 触屏滑动、合并计分、平滑移动 / 合并弹跳 / 新块弹出动画、按压与震动反馈、最高分持久化、胜利与结束提示、重新开始。
- **预览工作区**：预览 / 代码 / 检查结果 / 日志标签，桌面与手机设备切换、刷新、全屏、导出 HTML。
- **代码标签**：index.html / styles.css / app.js 三文件切换、行号显示、复制代码、导出完整 HTML。
- **双版本模型**：每次生成新版本仅保留「当前 + 上一版本」，版本号递增，可切换且预览与代码同步。
- **检查结果**：四项本地规则检查（可见内容 / 输入框 / 按钮 / localStorage），通过失败徽章随版本切换更新。
- **失败恢复演示**：模拟生成失败 → 错误提示条 → 重试 / 恢复上一版本。
- **登录与云端同步**：接入 Atoms Cloud（OIDC 登录），项目本地缓存 + 云端 `atom_projects` 表双向同步（800ms 防抖上传、登录后按 `project_key` 合并、删除同步）。
- **退出登录数据保护**：退出前先立即 flush 全部待同步数据，再清除当前账号已同步项目的本地缓存与应用数据；未同步成功的项目降级保留本地，避免网络异常丢数据。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · React Router |
| 后端 | Atoms Cloud（FastAPI + PostgreSQL，自动路由 `/api/v1/`） |
| 认证 | 平台 OIDC + PKCE（不自建密码体系），内置 `users` 表 |
| 数据 | `atom_projects` 表按 `user_id` 硬隔离；前端 localStorage 缓存 |

## 项目结构

```
app/
├── frontend/                  # React + shadcn/ui 前端
│   ├── src/
│   │   ├── App.tsx            # 路由与 Provider（/、/auth/callback、/auth/error）
│   │   ├── pages/             # Index、AuthCallback、AuthError、LogoutCallback 等
│   │   ├── hooks/
│   │   │   └── useProjects.ts # 项目状态、版本、生成、本地持久化、云同步、登出 flush
│   │   ├── lib/
│   │   │   ├── appGenerator.ts# 规则式应用生成器（2048 / 待办 / 番茄 / 习惯 / 自定义…）
│   │   │   ├── cloudSync.ts   # 云端项目 CRUD、同步载荷、登出封装
│   │   │   ├── checks.ts      # 四项本地规则检查
│   │   │   ├── auth.ts        # 认证 API、登录与 OIDC 登出跳转
│   │   │   └── api.ts         # Atoms Cloud Web SDK 单例
│   │   └── components/workbench/  # 创建页、左导航、需求面板、预览工作区
│   └── dist/                  # 生产构建产物
└── backend/                   # Atoms Cloud 后端
    ├── routers/               # atom_projects 实体 API、OIDC auth API
    ├── services/              # 项目 CRUD 与用户归属、认证与令牌签发
    ├── models/                # 项目模型（BigInteger 毫秒时间戳）、用户与 OIDC 状态
    └── alembic/versions/      # 建表与时间字段 int64 升级迁移
```

## 数据与存储说明

- `atom-taste-projects-v1`：项目列表本地缓存（含版本与云端行 id）。
- `atom-taste-ui-v1`：页面状态（创建页 / 编辑页、当前项目）。
- `atom-taste-{type}-{projectId}`：各应用独立运行数据（习惯 / 待办 / 番茄 / 自定义），按项目隔离。
- 云端 `atom_projects`：`project_key`（本地 id）、名称、需求、类型、状态、修改记录、版本 JSON、激活版本与毫秒时间戳；未登录时接口返回 `401`。

## 快速开始

```shell
# 安装依赖
pnpm i

# 本地开发预览
pnpm run dev

# 代码检查
pnpm run lint

# 生产构建（产物在 dist/）
pnpm run build
```

> 在 Atoms 平台上，预览服务会在文件变更后自动热重载，无需手动重启。

## 部署说明

本项目在 Atoms 平台上开发与发布，前端与后端（Atoms Cloud）均由平台托管，无需自备服务器、数据库或 OIDC 回调地址。

### 平台一键发布

1. 确认代码检查与生产构建通过：`pnpm run lint && pnpm run build`（前端产物位于 `app/frontend/dist/`）。
2. 在 **App Viewer** 中预览完整应用，确认创建、生成、同步、登录/退出流程正常。
3. 点击 **Publish** 按钮，在弹出的下拉框中可编辑发布链接（URL），或直接点击 Publish 完成部署。
4. 发布后可点击右上角 **Share** 复制链接分享；也可将可见性设为 Public / Secret / Private，或用 **Export** 下载全部代码文件。

详见 https://help.atoms.dev/en/articles/12129698-app-viewer 与 https://help.atoms.dev/en/articles/12129279-share 。

### 后端与数据

- **Atoms Cloud**（数据库、认证、对象存储）由平台托管，发布后自动可用，无需自行部署 FastAPI 服务或 PostgreSQL 实例。
- 登录采用平台 OIDC + PKCE，`/auth/callback` 与登出回调由平台处理，无需配置第三方认证域名。
- `atom_projects` 表已创建并完成迁移（含毫秒时间戳字段 BIGINT 升级），运行时按 `user_id` 自动隔离，前端无需处理行级权限。

### 配额与计费

- 发布项目使用 Cloud 能力；若 Cloud 或 AI 余额耗尽，需先为 Cloud & AI Wallet 充值后才能继续对应能力（如发布项目），详见 https://help.atoms.dev/en/articles/14432563-cloud-ai-wallet （充值入口 https://atoms.dev/dashboard?settings=cloudAiBalance ；Free 用户需先升级到 Pro 或 Max 才能充值）。

### 构建产物自检（可选）

发布前可在本地或平台终端验证构建：

```shell
cd app/frontend
pnpm i
pnpm run lint
pnpm run build   # 静态产物输出到 dist/
```

> 注意：登录与云端同步依赖 Atoms Cloud 后端与平台 Web SDK，在平台发布环境中完整可用；若仅将 `dist/` 静态产物托管到其他环境，登录/同步入口将不可用，仅保留匿名本地缓存与规则式应用生成功能。

## 使用流程

1. 打开应用进入**创建页**，输入需求（如「创建一个 2048 小游戏」）或点选示例。
2. 生成后进入**三栏工作台**，在预览区直接操作应用。
3. 在需求面板继续发送修改需求，生成新版本，可在版本间切换或恢复上一版。
4. 登录 Atoms Cloud 账号后，项目自动同步到云端；换设备登录可按 `project_key` 合并恢复。
5. 退出登录时自动 flush 未同步数据并清理账号本地缓存，共享设备不残留上一账号数据。