# dsh-visual

给 DeepSeek Harness 加一个 `visual` 工具：模型在对话里**实时生成一张可交互卡片**，用户点按钮后，工具**阻塞到点击完成才返回**，模型拿到用户的选择继续处理。

不经过助手文本、不发聊天消息、不是 artifact 预览——就是聊天流里一张真正的卡片。

## 安装 / 卸载

```bash
dsh plugin --profile desktop add /path/to/dsh-visual
# 卸载
dsh plugin --profile desktop remove dsh-visual
```

或者从 npm / 一个目录装：

```bash
dsh plugin --profile desktop add dsh-visual          # 已发布时
dsh plugin --profile desktop add /path/to/dsh-visual # 本地目录
```

装完**完整退出并重开** DeepSeek Harness（插件在启动时装配）；之后只改前端 bundle 时，⌘R 刷新页面即可。会话里可用的工具会多出 `visual`。

## 工具契约

```
visual({ title, html | flow, data?, height?, actions?, timeoutMs? })
  -> { ok, callId, id, sessionId, title, height, actions, data, answer }
       answer = { action, payload, message?, state? }
```

- `html`：卡片的 HTML 片段（或完整文档）。模型自己写，样式自包含。
- `actions`：id → 按钮文案的登记表，用于卡片底部提示。
- 调用会**一直挂着**（`timeoutMs`，默认 10 分钟，范围 1s–1h）直到用户在卡片里提交，返回 `answer: { action, payload, message, state }`。
- 超时返回 `answer.action = "timeout"`；用户在别处打断（中止）时返回 `answer.action = "cancelled"`。卡片保留为只读，页脚会说明发生了什么。
- 用户在卡片里点按钮时，插件把 `{ action, payload, message }` 作为工具结果交还模型——与 `ask_user_question` 同一思路，但是**自由形态的 HTML**。
- 卡片底部的「交还」是**中性**按钮：只把当前评论/输入交还，**不代表同意**。审核类卡片要让模型显式提供「通过 / 要改」两个 action。

## 卡片约定（给模型写 HTML 用）

- 按钮/链接上写 `data-visual-action="<action-id>"`，可选 `data-visual-payload='{"k":"v"}'`。
- 输入框、下拉、文本域标 `data-visual-field="<name>"`：用户提交时，所有带标记的控件值会收集进 `answer.fields`（`textarea` 取 `value`，`input` 取 `value`，`select` 取选中的值）。
- **本地动作 vs 终结动作**：卡片里不带 `data-visual-action` 的普通按钮（重置、撤销、切预览）只在卡片里生效，不会提交、工具继续等你；带 `data-visual-action` 的按钮才会提交。底部的 `actions` 全是终结动作。
- 先写字再点按钮：字段在点击那一刻收集，点了按钮才填写的内容不会回传。
- 卡片用 **Shadow DOM** 渲染：样式隔离，不会污染对话界面。**内联 `<script>` 会执行**（在消息页同一个 window 里），可以用事件监听做交互。
- 卡片在 shadow root 里，**脚本里要用 `dshVisual.root` 查元素**，不要用 `document`（`document` 指向消息页）。
- 脚本会被包成 `function (dshVisual) { ... }` 执行：用**裸 `dshVisual`**（它会被每个卡片实例捕获），不要用 `window.dshVisual`——并行多卡时后者会被最后渲染的卡覆盖。
- 脚本可用的桥（由插件注入）：
  - `dshVisual.root`：卡片的 shadow root。
  - `dshVisual.setState(v)`：记录当前状态；用户提交时随 `answer.state` 回到模型。
  - `dshVisual.followUp(actionId, payload, message)`：脚本里直接提交（不用等用户点按钮）。
  - `dshVisual.resize(px)`：调整卡片高度。
- 选择态也可以用原生 HTML 表达：`<input type="radio">`、`<details>`、`<label>`、`:checked` + CSS——不需要脚本。
- 布局自适应高度：内容变高会自动重新量高，不需要自己算高度。

示例：

```html
<h3>下周三值班，采用哪组排班？</h3>
<label class="opt"><input type="radio" name="g" value="A" checked> 方案 A：你 + 小林</label>
<label class="opt"><input type="radio" name="g" value="B"> 方案 B：三人轮转</label>
<div class="foot">
  <button class="primary" data-visual-action="confirm" data-visual-payload='{"group":"A"}'>采用方案 A</button>
  <button data-visual-action="shuffle">换一组</button>
</div>
```

## 边界（当前）

- Shadow DOM 不是安全沙箱：卡片脚本与页面同源，能读页面 DOM 与 `localStorage`。只渲染你信任的 HTML（模型生成的也可以，但它本身已被授权）。
- 阻塞期间该会话不能插入其他用户消息（工具调用占用中）。
- `state` 只在**这次提交**里往返，不落盘；要跨轮恢复，把需要的字段写进你的 prompt 和 `data`。
- 无历史卡片库、无事件队列——只保证“当前这次选择”闭环。

## 状态回写

```js
visual({
  title: '调整阈值',
  html: '<input id="t" type="range" min="0" max="100" value="40"><button data-visual-action="apply">应用</button>',
  data: { threshold: 40 },
  actions: [{ id: 'apply', label: '应用' }]
})
```

```html
<script>
  var input = document.getElementById('t');
  input.value = (dshVisual.data || {}).threshold || 40;
  input.addEventListener('input', function () {
    dshVisual.setState({ threshold: Number(input.value) });
  });
</script>
```

用户点「应用」后，`answer = { action: 'apply', payload: null, state: { threshold: 67 } }`。

## 发布

```bash
cd dsh-visual
npm run check      # node --check 两个入口
npm publish        # files 白名单里只有运行所需文件
```

`peerDependencies` 里的 `@deepseek-ai/dsh-tools`、`@deepseek-ai/dsh-typert-protocol`、`react` 由宿主提供；从 npm 安装时 dsh 的插件加载器会把它们重定向到安装包内的版本。
