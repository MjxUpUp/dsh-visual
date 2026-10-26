# Changelog

## 0.2.0

- Cards now run their own inline scripts (wrapped per card as `function (dshVisual) { ... }`), so interactions and multiple parallel cards keep independent state.
- New `data` argument seeds `dshVisual.data`; whatever the card sets through `dshVisual.setState(v)` returns as `answer.state`.
- New `timeoutMs` argument (default 10 min, 1s–1h). Timeouts return `answer.action = "timeout"`; cancellations return `"cancelled"` and the card stays visible read-only.
- Comment pins flip above the cursor near the card's bottom edge; card height re-measures with `ResizeObserver` and the body scrolls when content overflows.
- The footer's neutral button is now "交还" (it never implies approval); approval must come from explicit actions such as "通过" / "要改".
- Local actions (plain buttons without `data-visual-action`) only change the card and keep the tool waiting; terminal actions submit.
- Docs: publishing section, state round-trip example, `examples/login-review.html`.

## 0.1.0

- First working version: `visual` tool blocking on an inline HTML card, Shadow DOM rendering, right-click comments with pins, neutral submit button, draggable flow editor, host/client split through the dsh bundle patch + prebuilt client bundle.
