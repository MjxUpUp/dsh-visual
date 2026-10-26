import { randomUUID } from 'node:crypto'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

export const name = 'dsh-visual'
export const inject = ['tools']

/** How long a card waits for the user when the model does not set `timeoutMs`. */
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const MIN_TIMEOUT_MS = 1000
const MAX_TIMEOUT_MS = 60 * 60 * 1000

const DESCRIPTION = `Publish one interactive visual card inline in the conversation and WAIT for the user. Two kinds:

1. HTML card (pass \`html\`): the HTML is rendered into an isolated Shadow DOM. Styles are contained; inline scripts DO run, inside the message page (no iframe), so build interactions freely. Scripts can read initial state from \`window.dshVisual.data\`, call \`window.dshVisual.setState(value)\` to keep state, and call \`window.dshVisual.followUp(actionId, payload, message)\` to submit programmatically. Buttons with \`data-visual-action="<id>"\` and optional \`data-visual-payload='{"k":"v"}'\` submit an answer. Whatever state scripts set is returned as \`answer.state\`. Inputs with \`data-visual-field="<name>"\` are collected into \`answer.fields\` at submit time — tell the user in the card to type before clicking. The user can also right-click any element to attach a comment; every comment (anchor + text) is returned in \`answer.comments\` together with the clicked action's payload.

2. Flow card (pass \`flow\` instead of html): \`{nodes:[{id,label,x?,y?}], edges:[{from,to}]}\` renders as a draggable flowchart editor — the user drags nodes, double-clicks to rename, adds/deletes nodes and edges, then "交还给你" submits the adjusted graph as \`answer.payload.flow = {nodes:[{id,label,x,y}], edges}\`.

The card footer's neutral "交还" button submits the current comments/fields without implying approval. When the card is asking the user to approve something, include an explicit pair of actions (e.g. "通过" / "要改") — do not read the neutral 交还 as consent.

Prefer this over reading prose when a decision, comparison, diagram, or small tool is better operated than read. If the user needs to type a free-form reply, keep using ask_user_question instead.`

/**
 * Recreate the compiled `@Remote("method")` decorator without decorator
 * syntax (same trick as dsh-artifact): record the marker on the prototype
 * with a dummy `ClassMethodDecoratorContext` so `remoteMethods(service)`
 * picks the method up.
 */
function markRemote(cls, methodName) {
	Remote(methodName)(cls.prototype[methodName], {
		kind: 'method',
		name: methodName,
		static: false,
		private: false,
		addInitializer(fn) {
			fn.call(Object.create(cls.prototype))
		},
	})
}

/**
 * Pending cards, keyed by the tool call id. The browser half submits through
 * the `visual` Remote namespace; `execute` stays suspended until then, so the
 * answer arrives as the tool result instead of a user message.
 */
class VisualService extends TypertRemoteService {
	constructor(ctx) {
		super(ctx, 'visual')
		this.pending = new Map()
	}

	/**
	 * Register the wait for one call and resolve with the user's answer, a
	 * timeout, or a cancellation.
	 * @param {string} callId - the tool call id.
	 * @param {AbortSignal} [signal] - the tool call's signal.
	 * @param {number} [timeoutMs] - how long the card may stay open.
	 */
	wait(callId, signal, timeoutMs) {
		return new Promise((resolve) => {
			const finish = (value) => {
				this.pending.delete(callId)
				clearTimeout(timer)
				resolve(value)
			}
			const limit = typeof timeoutMs === 'number' ? timeoutMs : DEFAULT_TIMEOUT_MS
			const timer = setTimeout(() => finish({ action: 'timeout' }), limit)
			if (signal && typeof signal.addEventListener === 'function') {
				if (signal.aborted) finish({ action: 'cancelled' })
				else signal.addEventListener('abort', () => finish({ action: 'cancelled' }), { once: true })
			}
			this.pending.set(callId, { finish })
		})
	}

	/**
	 * @Remote submit — the browser half's answer: which action, with what data.
	 * @param {{callId?: string, action?: string, payload?: unknown, message?: string, state?: unknown}} request
	 */
	async submit(request) {
		const callId = request && request.callId
		const entry = callId ? this.pending.get(callId) : undefined
		if (!entry) return { ok: false, error: 'this card is no longer waiting for an answer' }
		entry.finish({
			action: typeof request.action === 'string' && request.action ? request.action : 'submit',
			payload: request.payload === undefined ? null : request.payload,
			message: typeof request.message === 'string' ? request.message : undefined,
			state: request.state === undefined ? null : request.state,
		})
		return { ok: true }
	}
}

markRemote(VisualService, 'submit')

/** Register the model-facing `visual` tool. */
function registerTool(ctx, service) {
	ctx.tools.register(
		defineTool({
			name: 'visual',
			description: DESCRIPTION,
			parameters: {
				title: {
					type: 'string',
					required: true,
					description: 'Short card title, plain text.',
				},
				html: {
					type: 'string',
					description:
						'Self-contained HTML fragment or document (styles are contained in a Shadow DOM; scripts are dropped). Use when the user should read/comment on UI, slides, reports, tables. Mutually exclusive with `flow`.',
				},
				flow: {
					type: 'object',
					additionalProperties: false,
					description:
						'Editable flowchart: { nodes: [{ id, label, x?, y? }], edges: [{ from, to, label? }] }. The user drags/renames/connects, and the adjusted graph comes back in answer.payload.flow. Mutually exclusive with `html`.',
					properties: {
						nodes: {
							type: 'array',
							required: true,
							items: {
								type: 'object',
								additionalProperties: false,
								properties: {
									id: { type: 'string', required: true },
									label: { type: 'string', required: true },
									x: { type: 'number' },
									y: { type: 'number' },
								},
							},
						},
						edges: {
							type: 'array',
							items: {
								type: 'object',
								additionalProperties: false,
								properties: {
									from: { type: 'string', required: true },
									to: { type: 'string', required: true },
									label: { type: 'string' },
								},
							},
						},
					},
				},
				data: {
					type: 'object',
					additionalProperties: true,
					description:
						'Initial state handed to the card\'s own scripts as `window.dshVisual.data`. When the user submits, whatever scripts set through `window.dshVisual.setState(...)` comes back as `answer.state`.',
				},
				timeoutMs: {
					type: 'number',
					description:
						'How long to wait for the user, in ms (1000–3600000, default 600000). On timeout the tool returns `answer.action = "timeout"` and the card stays visible read-only.',
				},
				height: {
					type: 'number',
					description: 'Initial card height in px (160–900, default 320). The card can resize itself with dshVisual.resize(n).',
				},
				actions: {
					type: 'array',
					description: 'Optional action registry shown in the card footer. Every action id used in data-visual-action should have an entry here so the card can label it.',
					items: {
						type: 'object',
						additionalProperties: false,
						properties: {
							id: { type: 'string', required: true, description: 'Action id passed to dshVisual.followUp.' },
							label: { type: 'string', required: true, description: 'Human label shown in the footer chip.' },
						},
					},
				},
			},
			output: {
				schema: { type: 'string' },
				render: (_args, value) => [{ type: 'text', text: value }],
			},
			async execute(args, exec) {
				const callId = exec?.callId ?? randomUUID()
				if (!args.html && !args.flow) {
					return JSON.stringify({ ok: false, error: 'visual needs either `html` or `flow`' })
				}
				const card = {
					id: randomUUID(),
					sessionId: exec?.agent?.id ?? null,
					title: args.title,
					html: args.html,
					flow: args.flow,
					height: typeof args.height === 'number' ? Math.min(900, Math.max(160, args.height)) : args.flow ? 380 : 320,
					actions: Array.isArray(args.actions) ? args.actions : [],
					data: args.data === undefined ? null : args.data,
				}
				const timeout = Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, typeof args.timeoutMs === 'number' ? args.timeoutMs : DEFAULT_TIMEOUT_MS))
				const answer = await service.wait(callId, exec?.signal, timeout)
				return JSON.stringify({ ok: true, callId, ...card, answer })
			},
		}),
	)
}

/** Mount the plugin: the Remote service plus the `visual` tool. */
export function apply(ctx) {
	const service = new VisualService(ctx)
	registerTool(ctx, service)
}
