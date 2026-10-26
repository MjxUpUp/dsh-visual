/**
 * dsh-visual — browser half: the inline interactive visual card.
 *
 * Hand-written module-loader bundle: the shell materializes the factory on
 * first import and mounts the returned cordis plugin.
 *
 * Two card kinds, both rendered in the tool view slot:
 *
 *  - HTML card: the model's HTML is rendered into a Shadow DOM (styles
 *    isolated, scripts dropped). Right-clicking any element opens a comment
 *    box; comments ride back with the answer.
 *  - Flow card: the model passes `flow` ({nodes, edges}); the card becomes a
 *    small editor — drag nodes, rename, connect, delete — and hands the
 *    adjusted graph back.
 *
 * Clicks flow back to the owner through `visual.submit` (a blocking Remote
 * call), so the answer arrives as the tool result, not as a chat message.
 */
window.__ModuleLoader__.load({
	id: "dsh-visual",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		var React = require("react");
		var h = React.createElement;

		var CSS = [
			".dshv-card{border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.24));border-radius:12px;background:var(--dsw-alias-bg-layer-1,transparent);margin:8px 0;overflow:hidden;font-size:13px;position:relative}",
			".dshv-head{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.16))}",
			".dshv-dot{width:6px;height:6px;border-radius:50%;background:#f59e0b;flex:none}",
			".dshv-title{font-weight:600;color:var(--dsw-alias-label-primary,inherit);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dshv-badge{font-size:11px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.9));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.3));border-radius:999px;padding:1px 7px}",
			".dshv-spacer{flex:1}",
			".dshv-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.3));background:transparent;color:var(--dsw-alias-label-secondary,rgba(90,90,90,.95));border-radius:6px;font-size:11px;padding:2px 8px;cursor:pointer;font-family:inherit}",
			".dshv-btn:hover{background:rgba(127,127,127,.1)}",
			".dshv-btn.primary{background:var(--dsw-alias-label-primary,#18181b);border-color:var(--dsw-alias-label-primary,#18181b);color:#fff}",
			".dshv-btn[disabled]{opacity:.45;cursor:default}",
			".dshv-canvas{position:relative}",
			".dshv-html{display:block;width:100%;overflow:auto}",
			".dshv-marks{position:absolute;inset:0;pointer-events:none}",
			".dshv-pin{position:absolute;min-width:18px;height:18px;border-radius:9px;background:#f59e0b;color:#fff;font-size:10.5px;line-height:18px;text-align:center;padding:0 4px;transform:translate(-50%,-50%);box-shadow:0 1px 3px rgba(0,0,0,.25);pointer-events:auto;cursor:default}",
			".dshv-pop{position:absolute;z-index:30;width:250px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#1f2328);border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.35));border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.16);padding:8px;font-size:12px}",
			".dshv-pop-h{font-size:11px;color:var(--dsw-alias-label-secondary,rgba(90,90,90,.95));margin:0 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dshv-pop textarea{width:100%;height:64px;box-sizing:border-box;resize:none;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.35));border-radius:7px;padding:6px 8px;font:inherit;font-size:12px;color:inherit;background:transparent;outline:none}",
			".dshv-pop textarea:focus{border-color:#f59e0b}",
			".dshv-pop-a{display:flex;justify-content:flex-end;gap:6px;margin-top:6px}",
			".dshv-src{margin:0;padding:10px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary,rgba(80,80,80,.95));white-space:pre-wrap;word-break:break-word;max-height:420px;overflow:auto}",
			".dshv-foot{display:flex;align-items:center;gap:6px;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.16));font-size:11.5px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95));flex-wrap:wrap}",
			".dshv-chip{font-size:11px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.28));border-radius:999px;padding:1px 8px}",
			".dshv-status{color:#16a34a}",
			".dshv-wait{padding:14px 12px;color:rgba(127,127,127,.9);font-size:12px}",
			".dshv-flow{position:relative;margin:10px 12px;border:1px dashed var(--dsw-alias-border-l1,rgba(127,127,127,.35));border-radius:10px;overflow:hidden;background:linear-gradient(rgba(127,127,127,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(127,127,127,.05) 1px,transparent 1px);background-size:20px 20px}",
			".dshv-flow svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}",
			".dshv-node{position:absolute;width:124px;min-height:40px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,#d8dde3);border-radius:9px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#1f2328);font-size:12px;line-height:1.35;padding:8px 10px;display:flex;align-items:center;justify-content:center;text-align:center;cursor:grab;user-select:none;touch-action:none}",
			".dshv-node:hover{border-color:#f59e0b}",
			".dshv-node.sel{border-color:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.25)}",
			".dshv-node.drag{cursor:grabbing}",
			".dshv-node input{width:100%;border:0;outline:0;text-align:center;font:inherit;background:transparent;color:inherit}",
			".dshv-flowbar{display:flex;align-items:center;gap:6px;padding:0 12px 10px;flex-wrap:wrap;font-size:11.5px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}",
			".dshv-edge{fill:none;stroke:var(--dsw-alias-label-tertiary,rgba(127,127,127,.6));stroke-width:1.6}",
			".dshv-edge.sel{stroke:#f59e0b;stroke-width:2.2}",
			".dshv-edge-hit{fill:none;stroke:transparent;stroke-width:14;cursor:pointer}",
		].join("\n");

		if (typeof document !== "undefined" && !document.querySelector("style[data-dsh-visual]")) {
			var style = document.createElement("style");
			style.setAttribute("data-dsh-visual", "");
			style.textContent = CSS;
			document.head.appendChild(style);
		}

		function isObject(value) {
			return value !== null && typeof value === "object";
		}

		/** Turn a PartialArguments instance (or plain object) into plain fields. */
		function plainArgs(value) {
			if (!isObject(value)) return null;
			var proto = Object.getPrototypeOf(value);
			if (proto === Object.prototype || proto === null) return value;
			var methods = ["toObject", "toJSON", "plain"];
			for (var i = 0; i < methods.length; i++) {
				if (typeof value[methods[i]] === "function") {
					try {
						var out = value[methods[i]]();
						if (isObject(out)) return out;
					} catch (error) {
						continue;
					}
				}
			}
			if (typeof value.html === "string" || typeof value.title === "string") return value;
			return null;
		}

		/** Read the fields a live call cares about from a PartialArguments view. */
		function partialArgs(value) {
			if (!isObject(value) || typeof value.keys !== "function" || typeof value.value !== "function") return null;
			var out = {};
			var names = ["title", "html", "height", "actions", "flow", "data"];
			for (var i = 0; i < names.length; i++) {
				var name = names[i];
				try {
					if (typeof value.has === "function" && !value.has(name)) continue;
					var text = typeof value.text === "function" ? value.text(name) : undefined;
					if (typeof text === "string" && text !== "") {
						out[name] = text;
						continue;
					}
					var parsed = value.value(name);
					if (parsed !== undefined) out[name] = parsed;
				} catch (error) {
					continue;
				}
			}
			return out.html || out.title || out.flow ? out : null;
		}

		function readFields(host) {
			var root = host && host.shadowRoot;
			if (!root) return null;
			var fields = null;
			var inputs = root.querySelectorAll("[data-visual-field]");
			for (var i = 0; i < inputs.length; i++) {
				var el = inputs[i];
				var name = el.getAttribute("data-visual-field");
				if (!name) continue;
				fields = fields || {};
				var type = (el.type || "").toLowerCase();
				if (type === "checkbox") {
					if (!Array.isArray(fields[name])) fields[name] = [];
					if (el.checked) fields[name].push(el.value || true);
				} else if (type === "radio") {
					if (el.checked) fields[name] = el.value;
				} else {
					fields[name] = el.value;
				}
			}
			return fields;
		}

		function renderIntoShadow(host, html, data, onState) {
			var root = host.shadowRoot || host.attachShadow({ mode: "open" });
			root.innerHTML = "";
			var doc;
			try {
				doc = new DOMParser().parseFromString(String(html || ""), "text/html");
			} catch (error) {
				return 0;
			}
			var base = doc.createElement("style");
			base.textContent = "html,body{margin:0;padding:0;font-family:inherit;color:inherit}*{box-sizing:border-box}";
			root.appendChild(base);
			var styleNodes = doc.querySelectorAll("style");
			for (var i = 0; i < styleNodes.length; i++) {
				var styleEl = document.createElement("style");
				var css = styleNodes[i].textContent || "";
				css = css.replace(/:root\b/g, ":host").replace(/(^|[^\w-])body\b/g, "$1.dshv-shadow");
				styleEl.textContent = css;
				root.appendChild(styleEl);
			}
			var linkNodes = doc.querySelectorAll("link[rel=stylesheet]");
			for (var j = 0; j < linkNodes.length; j++) root.appendChild(document.importNode(linkNodes[j], true));
			var wrap = document.createElement("div");
			wrap.className = "dshv-shadow";
			if (doc.body) {
				for (var child = doc.body.firstChild; child; child = child.nextSibling) wrap.appendChild(document.importNode(child, true));
			}
			root.appendChild(wrap);
			var bridge = {
				root: root,
				data: data === undefined ? null : data,
				setState: function (next) {
					try {
						if (typeof onState === "function") onState(next);
					} catch (error) {
						/* ignore */
					}
				},
				followUp: function (actionId, payload, message) {
					try {
						host.dispatchEvent(new CustomEvent("dshv:action", {
							detail: { action: String(actionId || ""), payload: payload === undefined ? null : payload, message: typeof message === "string" ? message : "" },
						}));
					} catch (error) {
						/* ignore */
					}
				},
				resize: function (next) {
					try {
						var value = Number(next);
						if (isFinite(value) && value > 0) {
							host.style.height = Math.min(1200, Math.max(140, value)) + "px";
						}
					} catch (error) {
						/* ignore */
					}
				},
			};
			// Best-effort global for single-card screens; parallel cards must use the
			// `dshVisual` parameter their script is wrapped with.
			if (typeof window !== "undefined") window.dshVisual = bridge;

			var scripts = wrap.querySelectorAll("script");
			for (var k = 0; k < scripts.length; k++) {
				var source = scripts[k].textContent || "";
				scripts[k].remove();
				if (!source.trim()) continue;
				try {
					new Function("dshVisual", source)(bridge);
				} catch (error) {
					if (typeof console !== "undefined") console.error("[dsh-visual] card script failed:", error);
				}
			}
			return wrap.scrollHeight || 0;
		}

		function readArgs(props) {
			var block = props.block || {};
			var call = block.call || {};
			var candidates = [block.argsRaw, call.argsRaw, props.argsRaw];
			for (var r = 0; r < candidates.length; r++) {
				var rawText = candidates[r];
				if (typeof rawText !== "string" || rawText === "") continue;
				try {
					var parsed = JSON.parse(rawText);
					if (isObject(parsed)) return parsed;
				} catch (error) {
					/* keep looking */
				}
			}
			var values = [block.args, block.params, block.input, call.args, call.params, props.args];
			for (var i = 0; i < values.length; i++) {
				var partial = partialArgs(values[i]);
				if (partial) return partial;
				var plain = plainArgs(values[i]);
				if (plain) return plain;
			}
			return {};
		}

		/** The tool result's text parts, joined. */
		function resultText(props) {
			var block = props.block || {};
			var lists = [block.content, block.result && block.result.content, block.output && block.output.content, props.result && props.result.content];
			for (var l = 0; l < lists.length; l++) {
				var content = lists[l];
				if (!Array.isArray(content)) continue;
				var parts = [];
				for (var i = 0; i < content.length; i++) {
					var part = content[i];
					if (part && part.type === "text" && typeof part.text === "string") parts.push(part.text);
				}
				if (parts.length) return parts.join("\n");
			}
			return "";
		}

		/** Parsed JSON payload of the result (the tool returns one JSON object). */
		function parsePayload(props) {
			var text = resultText(props);
			if (!text) return null;
			var at = text.indexOf("{");
			if (at < 0) return null;
			try {
				return JSON.parse(text.slice(at));
			} catch (error) {
				return null;
			}
		}

		var ctxRef = { current: null };
		var lastFollowUp = { key: "", at: 0 };

		/** Wire codec for one plain object argument/result (same shape typert emits). */
		function objectCodec() {
			var schema = { parse: function (value) { return value; } };
			return { mode: "strict", typeSymbol: "object", schema: schema, create: function () { return schema; } };
		}

		/** Hand-written typert descriptor for `visual.submit` (no codegen in this plugin). */
		var REMOTE_DESCRIPTOR = {
			package: "dsh-visual",
			descriptors: [{
				id: "dsh-visual#visual/submit",
				service: "visual",
				namespace: "visual",
				method: "submit",
				invocation: { kind: "direct" },
				parameters: [{ name: "request", wire: "request", source: "json", codec: objectCodec() }],
				result: objectCodec(),
			}],
		};

		var remoteRef = { service: null, ready: null, error: null };

		/** Mount the Remote namespace once; every card awaits the same promise. */
		function mountRemote(ctx) {
			if (remoteRef.ready) return;
			remoteRef.ready = Promise.resolve()
				.then(function () { return ctx.remote.$mount(REMOTE_DESCRIPTOR); })
				.then(function () {
					var service = ctx.get("remote.visual");
					if (!service) throw new Error("remote namespace `visual` missing");
					remoteRef.service = service;
					return service;
				})
				.catch(function (error) {
					remoteRef.error = error;
					return null;
				});
		}

		function remoteService() {
			if (remoteRef.service) return Promise.resolve(remoteRef.service);
			if (remoteRef.ready) return remoteRef.ready.then(function (svc) {
				if (!svc) throw remoteRef.error || new Error("共享通道不可用");
				return svc;
			});
			return Promise.reject(new Error("共享通道不可用"));
		}

		/* ------------------------------------------------------------------ */
		/* Comment anchors                                                     */
		/* ------------------------------------------------------------------ */

		function anchorOf(el, host) {
			var parts = [];
			var cur = el;
			var guard = 0;
			while (cur && cur !== host && cur.tagName && guard < 40) {
				guard++;
				var tag = cur.tagName.toLowerCase();
				var part = cur.getAttribute && (cur.getAttribute("data-part") || cur.getAttribute("data-role") || cur.getAttribute("data-comment-anchor"));
				if (part) {
					parts.unshift(tag + "[" + (cur.getAttribute("data-part") ? "data-part" : cur.getAttribute("data-role") ? "data-role" : "data-comment-anchor") + '="' + part + '"]');
					break;
				}
				if (cur.id) {
					parts.unshift(tag + "#" + cur.id);
					break;
				}
				var index = 1;
				var sib = cur;
				while ((sib = sib.previousElementSibling)) {
					if (sib.tagName === cur.tagName) index++;
				}
				parts.unshift(tag + ":nth-of-type(" + index + ")");
				cur = cur.parentElement;
			}
			return parts.join(" > ");
		}

		/* ------------------------------------------------------------------ */
		/* Flow helpers                                                        */
		/* ------------------------------------------------------------------ */

		var NODE_W = 124;
		var NODE_H = 40;

		function normalizeFlow(raw) {
			var nodes = [];
			var edges = [];
			if (raw && Array.isArray(raw.nodes)) {
				for (var i = 0; i < raw.nodes.length; i++) {
					var node = raw.nodes[i];
					if (!node) continue;
					nodes.push({
						id: String(node.id || "n" + i),
						label: String(node.label || node.id || "节点"),
						x: typeof node.x === "number" ? node.x : 40 + i * 170,
						y: typeof node.y === "number" ? node.y : 90,
					});
				}
			}
			if (raw && Array.isArray(raw.edges)) {
				for (var j = 0; j < raw.edges.length; j++) {
					var edge = raw.edges[j];
					if (!edge) continue;
					edges.push({
						from: String(edge.from || ""),
						to: String(edge.to || ""),
						label: edge.label ? String(edge.label) : "",
					});
				}
			}
			return { nodes: nodes, edges: edges };
		}

		function centerOf(node) {
			return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
		}

		/** Clip a center-to-center segment at the node rectangle border. */
		function clipToBox(node, dx, dy) {
			var cx = node.x + NODE_W / 2;
			var cy = node.y + NODE_H / 2;
			if (!dx && !dy) return { x: cx, y: cy };
			var halfW = NODE_W / 2 + 3;
			var halfH = NODE_H / 2 + 3;
			var scale = Math.min(Math.abs(halfW / (dx || 1e-6)), Math.abs(halfH / (dy || 1e-6)));
			return { x: cx + dx * scale, y: cy + dy * scale };
		}

		function flowPath(from, to) {
			var a = centerOf(from);
			var b = centerOf(to);
			var dx = b.x - a.x;
			var dy = b.y - a.y;
			var start = clipToBox(from, dx, dy);
			var end = clipToBox(to, -dx, -dy);
			return "M " + start.x + " " + start.y + " L " + end.x + " " + end.y;
		}

		/* ------------------------------------------------------------------ */
		/* Card                                                                */
		/* ------------------------------------------------------------------ */

		function VisualCard(props) {
			var args = readArgs(props);
			var payload = parsePayload(props);
			var title = String(args.title || (payload && payload.title) || "可视化卡片");
			var html = String(args.html || (payload && payload.html) || "");
			var rawFlow = args.flow || (payload && payload.flow) || null;
			var flow = rawFlow ? normalizeFlow(rawFlow) : null;
			var data = args.data !== undefined ? args.data : payload && payload.data !== undefined ? payload.data : null;
			var initialHeight = Number(args.height || (payload && payload.height) || (flow ? 360 : 320));
			if (!isFinite(initialHeight)) initialHeight = flow ? 360 : 320;
			var actions = Array.isArray(args.actions) ? args.actions : Array.isArray(payload && payload.actions) ? payload.actions : [];
			var sessionId = (payload && payload.sessionId) || null;
			var hasContent = !!(props.block && Array.isArray(props.block.content) && props.block.content.length > 0);
			var settled = hasContent || (props.block && props.block.call && props.block.call.name);
			var callId = props.callId || (payload && payload.callId) || null;

			var tabState = React.useState("render");
			var tab = tabState[0];
			var setTab = tabState[1];
			var frameHeightState = React.useState(Math.min(900, Math.max(160, initialHeight)));
			var frameHeight = frameHeightState[0];
			var setFrameHeight = frameHeightState[1];
			var statusState = React.useState("");
			var status = statusState[0];
			var setStatus = statusState[1];
			var commentsState = React.useState([]);
			var comments = commentsState[0];
			var setComments = commentsState[1];
			var popState = React.useState(null);
			var pop = popState[0];
			var setPop = popState[1];
			var popInputRef = React.useRef(null);
			var commentsRef = React.useRef(comments);
			commentsRef.current = comments;

			var hostRef = React.useRef(null);
			var stateRef = React.useRef(null);
			var wrapRef = React.useRef(null);
			var tabRef = React.useRef(tab);
			tabRef.current = tab;

			/* ---------------- HTML card: render + comments ---------------- */

			React.useEffect(function () {
				var host = hostRef.current;
				if (!host || !html) return;
				var measure = function () {
					try {
						var height = renderIntoShadow(host, html, data, function (next) { stateRef.current = next; });
						if (height > 0) setFrameHeight(Math.min(1200, Math.max(140, height + 8)));
					} catch (error) {
						setStatus("渲染失败：" + String((error && error.message) || error));
					}
				};
				measure();
				var observer = null;
				if (typeof ResizeObserver === "function") {
					var wrapNode = host.shadowRoot && host.shadowRoot.querySelector(".dshv-shadow");
					if (wrapNode) {
						observer = new ResizeObserver(function () {
							var next = Math.min(1200, Math.max(140, wrapNode.scrollHeight + 8));
							setFrameHeight(function (prev) { return Math.abs(prev - next) > 2 ? next : prev; });
						});
						observer.observe(wrapNode);
					}
				}
				var onClick = function (event) {
					var path = event.composedPath ? event.composedPath() : [];
					for (var i = 0; i < path.length; i++) {
						var node = path[i];
						if (node && node.getAttribute && node.getAttribute("data-visual-action")) {
							var actionId = node.getAttribute("data-visual-action");
							var raw = node.getAttribute("data-visual-payload");
							var extra = null;
							if (raw) {
								try {
									extra = JSON.parse(raw);
								} catch (error) {
									extra = null;
								}
							}
							var fields = readFields(host);
							if (fields) {
								extra = extra && typeof extra === "object" ? extra : {};
								extra.fields = fields;
							}
							if (commentsRef.current.length) {
								extra = extra && typeof extra === "object" ? extra : {};
								extra.comments = commentsRef.current.map(function (c) {
									return { selector: c.selector, label: c.label, text: c.text };
								});
							}
							followUpRef.current && followUpRef.current(actionId, extra ? { payload: extra } : null);
							return;
						}
					}
				};
				var onProgrammatic = function (event) {
					var detail = (event && event.detail) || {};
					if (!detail.action) return;
					followUpRef.current(String(detail.action), {
						payload: detail.payload === undefined ? null : detail.payload,
						message: typeof detail.message === "string" && detail.message ? detail.message : null,
					});
				};
				host.addEventListener("click", onClick);
				host.addEventListener("dshv:action", onProgrammatic);
				return function () {
					host.removeEventListener("click", onClick);
					host.removeEventListener("dshv:action", onProgrammatic);
					if (observer) observer.disconnect();
				};
			}, [html]);

			React.useEffect(function () {
				var wrap = wrapRef.current;
				if (!wrap || !html) return;
				var onCtx = function (event) {
					if (tabRef.current === "source") return;
					var path = event.composedPath ? event.composedPath() : [];
					var target = null;
					for (var i = 0; i < path.length; i++) {
						var node = path[i];
						if (node === wrap) break;
						if (node && node.tagName) {
							target = node;
							break;
						}
					}
					if (!target) return;
					event.preventDefault();
					var rect = target.getBoundingClientRect();
					var wrapRect = wrap.getBoundingClientRect();
					var host = hostRef.current;
					var POP_H = 150;
					var localY = event.clientY - wrapRect.top;
					var below = localY + POP_H + 10 <= wrapRect.height - 4;
					setPop({
						selector: anchorOf(target, host),
						label: String(target.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) || target.tagName.toLowerCase(),
						x: rect.left - wrapRect.left + rect.width / 2,
						y: rect.top - wrapRect.top + 4,
						px: Math.max(6, Math.min(event.clientX - wrapRect.left, wrapRect.width - 262)),
						py: below ? Math.max(6, localY) : Math.max(6, localY - POP_H - 8),
						text: "",
					});
					window.setTimeout(function () {
						if (popInputRef.current) popInputRef.current.focus();
					}, 0);
				};
				wrap.addEventListener("contextmenu", onCtx);
				return function () {
					wrap.removeEventListener("contextmenu", onCtx);
				};
			}, [html]);

			var addComment = function () {
				if (!pop) return;
				var text = pop.text.trim();
				if (!text) {
					setPop(null);
					return;
				}
				setComments(commentsRef.current.concat([{
					selector: pop.selector,
					label: pop.label,
					text: text,
					x: pop.x,
					y: pop.y,
				}]));
				setPop(null);
			};

			var followUp = function (actionId, extra) {
				var key = String(actionId || "") + "|" + JSON.stringify((extra && extra.payload) || null);
				var now = Date.now();
				if (lastFollowUp.key === key && now - lastFollowUp.at < 400) return;
				lastFollowUp.key = key;
				lastFollowUp.at = now;

				var label = actionId;
				for (var i = 0; i < actions.length; i++) {
					if (actions[i] && actions[i].id === actionId && actions[i].label) label = actions[i].label;
				}
				var extraPayload = extra && extra.payload && typeof extra.payload === "object" ? extra.payload : null;
				if (commentsRef.current.length && (!extraPayload || !extraPayload.comments)) {
					extraPayload = extraPayload || {};
					extraPayload.comments = commentsRef.current.map(function (c) {
						return { selector: c.selector, label: c.label, text: c.text };
					});
				}
				var explicit = extra && typeof extra.message === "string" && extra.message ? extra.message : null;

				if (!settled) {
					setStatus("提交中…");
					remoteService()
						.then(function (svc) {
							return svc.submit({ callId: callId, action: actionId, payload: extraPayload, message: explicit || undefined, state: stateRef.current });
						})
						.then(function (result) {
							if (result && result.ok === false) throw new Error(result.error || "提交失败");
							setStatus("已提交 · " + label);
						})
						.catch(function (error) {
							setStatus("提交失败：" + String((error && error.message) || error));
						});
					return;
				}

				// A card whose call already returned can still talk to the session.
				var sessions = ctxRef.current && ctxRef.current.sessions;
				var binding = sessions && typeof sessions.binding === "function" && sessionId ? sessions.binding(sessionId) : null;
				var session = binding && binding.session;
				if (!session || typeof session.prompt !== "function") {
					setStatus("回传不可用：找不到会话");
					return;
				}
				var text = explicit || ("我在可视化卡片「" + title + "」里点击了「" + label + "」" +
					(extraPayload && Object.keys(extraPayload).length ? "，附带数据：" + JSON.stringify(extraPayload) : "") +
					"。请按这个结果继续。");
				setStatus("发送中…");
				Promise.resolve(session.prompt([{ type: "text", text: text }], "queue"))
					.then(function (result) {
						setStatus(result && result.ok === false ? "回传失败" : "已回传，等我继续");
					})
					.catch(function (error) {
						setStatus("回传出错：" + String((error && error.message) || error));
					});
			};

			var followUpRef = React.useRef(followUp);
			followUpRef.current = followUp;

			var header = h("div", { className: "dshv-head" },
				h("span", { className: "dshv-dot" }),
				h("span", { className: "dshv-title" }, title),
				h("span", { className: "dshv-badge" }, flow ? "流程图" : "可视化"),
				h("span", { className: "dshv-spacer" }),
				h("button", {
					className: "dshv-btn",
					title: "查看源码",
					onClick: function () { setTab(tab === "render" ? "source" : "render"); },
				}, tab === "render" ? "<>" : "关闭源码"),
			);

			if (!html && !flow) {
				return h("div", { className: "dshv-card" },
					header,
					h("div", { className: "dshv-wait" }, settled ? "这张卡片没有内容：调用参数里没有 html / flow。" : "正在生成可视化卡片…"),
				);
			}

			var sourceText = flow ? JSON.stringify(flow, null, 2) : html;

			var canvas = h("div", { style: { display: tab === "source" ? "none" : "block" } },
				h("div", { className: "dshv-canvas", ref: wrapRef },
					h("div", { className: "dshv-html", ref: hostRef, style: { height: frameHeight + "px" } }),
					h("div", { className: "dshv-marks" },
						comments.map(function (comment, index) {
							return h("span", {
								key: "pin-" + index,
								className: "dshv-pin",
								style: { left: comment.x + "px", top: comment.y + "px" },
								title: comment.label + "：" + comment.text,
							}, index + 1);
						}),
					),
					pop ? h("div", {
						className: "dshv-pop",
						style: { left: pop.px + "px", top: pop.py + "px" },
					},
						h("div", { className: "dshv-pop-h" }, "评论：" + pop.label),
						h("textarea", {
							ref: popInputRef,
							value: pop.text,
							placeholder: "写下你的修改意见…",
							onChange: function (event) {
								var text = event.target.value;
								setPop(function (prev) { return prev ? Object.assign({}, prev, { text: text }) : prev; });
							},
							onKeyDown: function (event) {
								if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) addComment();
								if (event.key === "Escape") setPop(null);
							},
						}),
						h("div", { className: "dshv-pop-a" },
							h("button", { className: "dshv-btn", onClick: function () { setPop(null); } }, "取消"),
							h("button", { className: "dshv-btn primary", onClick: addComment }, "添加"),
						),
					) : null,
				),
			);

			var sourcePane = tab === "source" ? h("pre", { className: "dshv-src" }, sourceText) : null;

			var body = flow
				? (tab === "source" ? sourcePane : h(FlowEditor, {
					flow: flow,
					height: frameHeight,
					disabled: settled,
					onSubmit: function (next) {
						followUp("flow", { payload: { flow: next } });
					},
				}))
				: h("div", null, canvas, sourcePane);

			var answerInfo = payload && payload.answer ? payload.answer : null;
			var ended = answerInfo && (answerInfo.action === "timeout" || answerInfo.action === "cancelled");
			var footer = h("div", { className: "dshv-foot" },
				h("span", null, settled
					? ended
						? answerInfo.action === "timeout"
							? "已超时，这轮没提交"
							: "这轮已取消"
						: "这张卡已结束"
					: flow
						? "拖动节点调整，改完点「交还给你」"
						: html
							? "右键任意元素写评论；点下面按钮交还"
							: "在卡片里选一项提交，我会等你"),
				comments.length ? h("span", { className: "dshv-chip" }, comments.length + " 条评论") : null,
				status ? h("span", { className: status.indexOf("已回传") === 0 ? "dshv-status" : "" }, status) : null,
				h("span", { className: "dshv-spacer" }),
				actions.map(function (action) {
					return h("button", {
						key: "chip-" + action.id,
						className: "dshv-btn",
						disabled: settled,
						onClick: function (event) {
							event.stopPropagation();
							followUp(action.id, null);
						},
					}, action.label || action.id);
				}),
				!flow && !settled ? h("button", {
					className: "dshv-btn primary",
					title: "把评论和输入交还，不代表同意设计",
					onClick: function (event) {
						event.stopPropagation();
						followUp("done", null);
					},
				}, "交还") : null,
			);

			return h("div", { className: "dshv-card" }, header, body, footer);
		}

		/* ------------------------------------------------------------------ */
		/* Flow editor                                                         */
		/* ------------------------------------------------------------------ */

		function FlowEditor(props) {
			var state = React.useState(function () {
				return {
					nodes: props.flow.nodes.map(function (n) { return Object.assign({}, n); }),
					edges: props.flow.edges.map(function (e) { return Object.assign({}, e); }),
				};
			});
			var graph = state[0];
			var setGraph = state[1];
			var selectedState = React.useState(null);
			var selected = selectedState[0];
			var setSelected = selectedState[1];
			var linkState = React.useState(false);
			var linking = linkState[0];
			var setLinking = linkState[1];
			var dragRef = React.useRef(null);
			var graphRef = React.useRef(graph);
			graphRef.current = graph;

			var width = 640;
			var height = props.height;

			var moveNode = function (id, x, y) {
				setGraph(function (prev) {
					return {
						nodes: prev.nodes.map(function (n) {
							return n.id === id ? Object.assign({}, n, { x: Math.max(0, Math.min(width - NODE_W, x)), y: Math.max(0, Math.min(height - NODE_H, y)) }) : n;
						}),
						edges: prev.edges,
					};
				});
			};

			var onPointerDown = function (event, node) {
				if (props.disabled) return;
				event.stopPropagation();
				if (linking) {
					if (!selected) {
						setSelected(node.id);
					} else if (selected !== node.id) {
						setGraph(function (prev) {
							var exists = prev.edges.some(function (e) { return e.from === selected && e.to === node.id; });
							return exists ? prev : { nodes: prev.nodes, edges: prev.edges.concat([{ from: selected, to: node.id, label: "" }]) };
						});
						setSelected(null);
						setLinking(false);
					} else {
						setSelected(null);
					}
					return;
				}
				setSelected(node.id);
				var startX = node.x;
				var startY = node.y;
				var startPointerX = event.clientX;
				var startPointerY = event.clientY;
				dragRef.current = { id: node.id, startX: startX, startY: startY, px: startPointerX, py: startPointerY };
				if (event.currentTarget && event.currentTarget.setPointerCapture) {
					try { event.currentTarget.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ }
				}
			};

			React.useEffect(function () {
				var onMove = function (event) {
					var drag = dragRef.current;
					if (!drag) return;
					moveNode(drag.id, drag.startX + (event.clientX - drag.px), drag.startY + (event.clientY - drag.py));
				};
				var onUp = function () {
					dragRef.current = null;
				};
				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp);
				return function () {
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
				};
			}, []);

			var addNode = function () {
				setGraph(function (prev) {
					var index = prev.nodes.length;
					var node = {
						id: "n" + (index + 1) + "-" + Date.now().toString(36),
						label: "新节点",
						x: 30 + (index % 3) * 150,
						y: 40 + Math.floor(index / 3) * 80,
					};
					return { nodes: prev.nodes.concat([node]), edges: prev.edges };
				});
			};

			var removeSelected = function () {
				if (!selected) return;
				setGraph(function (prev) {
					return {
						nodes: prev.nodes.filter(function (n) { return n.id !== selected; }),
						edges: prev.edges.filter(function (e) { return e.from !== selected && e.to !== selected; }),
					};
				});
				setSelected(null);
			};

			var rename = function (id, label) {
				setGraph(function (prev) {
					return {
						nodes: prev.nodes.map(function (n) { return n.id === id ? Object.assign({}, n, { label: label || "节点" }) : n; }),
						edges: prev.edges,
					};
				});
			};

			var submit = function () {
				var latest = graphRef.current;
				props.onSubmit({
					nodes: latest.nodes.map(function (n) { return { id: n.id, label: n.label, x: Math.round(n.x), y: Math.round(n.y) }; }),
					edges: latest.edges.map(function (e) { return { from: e.from, to: e.to, label: e.label }; }),
				});
			};

			return h("div", null,
				h("div", { className: "dshv-flow", style: { height: height + "px" } },
					h("svg", { viewBox: "0 0 " + width + " " + height, preserveAspectRatio: "xMinYMin meet" },
						h("defs", null,
							h("marker", { id: "dshv-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse" },
								h("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "rgba(127,127,127,.7)" })
							)
						),
						graph.edges.map(function (edge, index) {
							var from = graph.nodes.filter(function (n) { return n.id === edge.from; })[0];
							var to = graph.nodes.filter(function (n) { return n.id === edge.to; })[0];
							if (!from || !to) return null;
							return h("g", { key: "edge-" + index },
								h("path", {
									className: "dshv-edge" + (selected === "edge:" + index ? " sel" : ""),
									d: flowPath(from, to),
									markerEnd: "url(#dshv-arrow)",
								}),
								h("path", {
									className: "dshv-edge-hit",
									d: flowPath(from, to),
									onClick: function (event) {
										event.stopPropagation();
										setSelected("edge:" + index);
									},
								})
							);
						})
					),
					graph.nodes.map(function (node) {
						return h("div", {
							key: node.id,
							className: "dshv-node" + (selected === node.id ? " sel" : ""),
							style: { left: node.x + "px", top: node.y + "px" },
							onPointerDown: function (event) { onPointerDown(event, node); },
							onDoubleClick: function (event) {
								event.stopPropagation();
								rename(node.id, window.prompt("节点名称", node.label) || node.label);
							},
						}, node.label);
					})
				),
				h("div", { className: "dshv-flowbar" },
					h("button", { className: "dshv-btn", onClick: addNode, disabled: props.disabled }, "+ 节点"),
					h("button", {
						className: "dshv-btn",
						onClick: function () { setLinking(!linking); setSelected(null); },
						disabled: props.disabled || graph.nodes.length < 2,
					}, linking ? "连线中…（点两个节点）" : "连线"),
					h("button", { className: "dshv-btn", onClick: removeSelected, disabled: props.disabled || !selected }, "删除所选"),
					h("span", { className: "dshv-spacer" }),
					h("span", null, "双击改名"),
					h("button", { className: "dshv-btn primary", onClick: submit, disabled: props.disabled || linking }, "交还给你"),
				),
			);
		}

		function apply(ctx) {
			ctxRef.current = ctx;
			mountRemote(ctx);
			ctx.slots.inject("tool.call.toolview", function () {
				return ctx.slots.register({ name: "tool.call.toolview", key: "visual" }, VisualCard);
			});
		}

		var plugin = { name: "dsh-visual", inject: ["slots", "sessions", "remote"], apply: apply };
		module.exports = plugin;
		module.exports.default = plugin;
		return module.exports;
	},
});
