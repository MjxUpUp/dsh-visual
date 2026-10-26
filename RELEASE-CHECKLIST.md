# Release checklist — dsh-visual 0.1.0

范围：npm 包 `dsh-visual@0.1.0`（宿主插件 + 手写客户端 bundle），发布到 npm registry，供 `dsh plugin add` 安装。
决策：待确认 registry / 仓库地址后执行（见文末「待你拍板」）。

## Mandatory

| 项 | 状态 | 证据 |
|---|---|---|
| M1 版本一致性 | ✅ | `package.json` 3: `"version": "0.1.0"`；`CHANGELOG.md` 首个 `## 0.1.0`；`git tag -l` 为空（尚未打 tag）；`lib/` 内无版本常量 |
| M2 CHANGELOG | ✅ | `## 0.1.0` 一节；0.1.0 为首次公开发布（此前未发布过任何版本） |
| M3 构建产物 | ✅ | 无构建步骤；`npm run check` 绿（两个入口 `node --check` + docs guard）；`npm pack` 20.5 kB / 8 files；tarball 在干净 profile 用 pnpm 实装成功 |
| M4 数据库迁移 | N/A | 插件无持久化 |
| M5 Secrets | ✅ | `grep -rnE '(sk-…\|ghp_…\|AKIA…\|PRIVATE KEY)'` 无命中；无 token/密钥文件 |
| M6 文档一致性 | ✅ | 新增 `scripts/docs-check.mjs` 守卫：校验 files 白名单、exports、README 中 7 个参数 + 5 个返回/桥字段、CHANGELOG 头与版本一致；`npm run check` 绿 |
| M7 Smoke | ✅（应用内） | 真机演示：卡 F（勾选字段 + 评论）、卡 G（滑块 state）、登录页 v3（显式 approve）、流程编辑器、三卡并行隔离；tarball 安装烟测通过。注：空白 profile 不装配宿主 `tools` 服务，插件显示 `pending (waiting for service: tools)` 属正常 overlay 语义，不能作为 smoke 环境 |

## Recommended

| 项 | 状态 | 说明 |
|---|---|---|
| R1 回滚 | ⚠ | 发坏版本用 `npm deprecate dsh-visual@x.y.z "reason"` + 发 patch；`unpublish` 仅 72h 内且同版本不可复用。写进 README 发布段 |
| R2 已知问题 | ✅ | README「边界」：Shadow DOM 非安全沙箱、阻塞期间不能插消息、`state` 不落盘 |
| R3 观测 | N/A | 插件无服务端；失败在卡片页脚显示 `提交失败：…` |
| R4 公告 | ⚠ | CHANGELOG 即 release notes；如需对外公告需另写 |
| R5 灰度 | ⚠ | 用 dist-tag：`npm publish --tag next` → 装一次验证 → `npm dist-tag add dsh-visual@0.1.0 latest` |
| R6 Forge eval | N/A | 非 Forge 门禁项目 |

## 审计中发现并已修复

1. **peer 依赖导致从 npm 安装失败（阻断级）**：`@deepseek-ai/dsh-tools`、`dsh-typert-protocol`、`react` 作为普通 peer 会让 pnpm 的 auto-install-peers 去公网拉 `@deepseek-ai/dsh-type-meta`，干净 profile 安装报 `not in the npm registry`。改为 `peerDependenciesMeta` 全部 `optional: true` 后，tarball 在空白 profile 安装成功（pnpm v11.28.5，281ms）。
2. 工具 `height` 描述仍写 iframe → 改为 card height。
3. README 缺 `answer.payload` / `answer.comments` / `answer.fields` 的说明 → 补齐。
4. `files` 缺 `CHANGELOG.md` → 补上。
5. 新增 `scripts/docs-check.mjs` 与 `.gitignore`。

## 已拍板

1. **registry**：公网 npmjs；`dsh-visual` 在 npmjs 返回 404（未占用），另有 `dsh-visual-cards` / `dsh-inline-visual` 可用，`dsh-generative-ui` 已被占用。
2. **仓库**：`https://github.com/MjxUpUp/dsh-visual`（GitHub 账号 MjxUpUp，gh 已登录；repo scope 可用）。
3. **作者**：MjxUpUp <44393475+MjxUpUp@users.noreply.github.com>。
4. **版本号**：0.1.0（首次公开发布）。

## 仍未就绪

- 本机 npmjs 未登录（`npm whoami --registry=https://registry.npmjs.org/` → 401），发布前需 `npm login` 并提供 2FA。

## 发布步骤（确认后）

```bash
cd dsh-visual
npm run check
npm pack --dry-run
npm publish --tag next         # 或 --registry https://registry.npmjs.org
# 装一次验证
dsh plugin --profile desktop add dsh-visual@0.1.0
npm dist-tag add dsh-visual@0.1.0 latest
git tag v0.1.0 && git push --tags
```
