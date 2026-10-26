# Release checklist — dsh-visual 0.2.0

范围：npm 包 `dsh-visual@0.2.0`（宿主插件 + 手写客户端 bundle），发布到 npm registry，供 `dsh plugin add` 安装。
决策：待确认 registry / 仓库地址后执行（见文末「待你拍板」）。

## Mandatory

| 项 | 状态 | 证据 |
|---|---|---|
| M1 版本一致性 | ✅ | `package.json` 3: `"version": "0.2.0"`；`CHANGELOG.md` 首个 `## 0.2.0`；`git tag -l` 为空（尚未打 tag）；`lib/` 内无版本常量 |
| M2 CHANGELOG | ✅ | `## 0.2.0`、`## 0.1.0` 两节；0.2.0 记录脚本/状态/超时/交还语义/隔离修复；0.1 从未发布，无历史用户 |
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
| R5 灰度 | ⚠ | 用 dist-tag：`npm publish --tag next` → 装一次验证 → `npm dist-tag add dsh-visual@0.2.0 latest` |
| R6 Forge eval | N/A | 非 Forge 门禁项目 |

## 审计中发现并已修复

1. **peer 依赖导致从 npm 安装失败（阻断级）**：`@deepseek-ai/dsh-tools`、`dsh-typert-protocol`、`react` 作为普通 peer 会让 pnpm 的 auto-install-peers 去公网拉 `@deepseek-ai/dsh-type-meta`，干净 profile 安装报 `not in the npm registry`。改为 `peerDependenciesMeta` 全部 `optional: true` 后，tarball 在空白 profile 安装成功（pnpm v11.28.5，281ms）。
2. 工具 `height` 描述仍写 iframe → 改为 card height。
3. README 缺 `answer.payload` / `answer.comments` / `answer.fields` 的说明 → 补齐。
4. `files` 缺 `CHANGELOG.md` → 补上。
5. 新增 `scripts/docs-check.mjs` 与 `.gitignore`。

## 待你拍板（发布前）

1. **registry**：公网 npmjs（`dsh-visual` 名字可用，E404 即未占用）还是公司 nexus（当前 `npm config get registry` 指向 nexus）？
2. **仓库地址**：`package.json` 里现在写的是 `https://github.com/jxma/dsh-visual.git`（猜的），实际 owner/URL？
3. **作者与版权**：`author` 字段和 LICENSE 署名。
4. **版本号**：直接 0.2.0 首公开，还是 1.0.0？

## 发布步骤（确认后）

```bash
cd dsh-visual
npm run check
npm pack --dry-run
npm publish --tag next         # 或 --registry https://registry.npmjs.org
# 装一次验证
dsh plugin --profile desktop add dsh-visual@0.2.0
npm dist-tag add dsh-visual@0.2.0 latest
git tag v0.2.0 && git push --tags
```
