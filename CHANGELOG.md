# Changelog

## 0.1.1

Packaging and release automation.

- Declare the compatible Harness range in `engines.dsh`, which the plugin market index requires.
- Add a tag-triggered publish workflow (checks, npm publish with provenance, GitHub Release) and a CI workflow.
- Rewrite the README in standard OSS shape: badges, screenshot, features, requirements, install, tool contract, card protocol, development and release steps.
- Ship `screenshots.json` and `docs/screenshot.png` so market listings can show the card.

## 0.1.0

First public release.

- `visual` tool: the model publishes an interactive card inline in the conversation and the call blocks until the user submits — the answer comes back as the tool result, not a chat message.
- HTML cards render in a Shadow DOM with contained styles. Card scripts run per card (`function (dshVisual) { ... }`), so parallel cards keep independent state; `dshVisual.data` seeds state, `dshVisual.setState(v)` returns `answer.state`, `dshVisual.followUp(...)` submits programmatically.
- Flow cards: draggable/renameable nodes and edges, submitted as `answer.payload.flow`.
- Right-click any element to attach a comment with a numbered pin; comments travel in `answer.comments` along with the clicked action's payload.
- `data-visual-action` buttons submit; `data-visual-field` controls are collected into `answer.fields`; the footer's neutral "交还" never implies approval.
- `timeoutMs` (default 10 min, 1s–1h) returns `answer.action = "timeout"`; cancelling returns `"cancelled"` and leaves the card read-only.
- Packaged for `dsh plugin add`, with `examples/login-review.html` and a docs/code consistency guard (`npm run check`).
