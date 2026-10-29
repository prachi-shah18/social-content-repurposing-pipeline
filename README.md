# Social Content Repurposing Pipeline

## Purpose and workflow

For a content or social-media marketer who needs channel-specific starting drafts from an approved source. Enter a title and source, optionally set audience, voice, objective, format, and call to action, select destinations, then review and edit the resulting drafts. Copy a draft or export the current edits with their source excerpts.

## Rules and output validation

- Source text must be 40–20,000 characters, and at least one destination must be selected.
- Local mode selects verbatim source sentences, then adds clearly labelled editorial framing. It does not claim that framing is live AI output.
- Platform templates differ by format; X drafts are limited to 280 characters. Treat all output as a review draft.
- AI mode is optional and server-side. Returned platform, body length, source excerpts, and exact traceability are checked before display. Invalid responses fall back to clearly labelled local output.
- Copy and export use the editable text currently in the workspace.

## Technology and run

HTML, shared CSS, browser JavaScript modules, and Node.js; no third-party packages or build step.

```powershell
node server.mjs
```

Run this command from this project directory; the standalone server uses port 4171 by default. Local mode needs no environment variables. Optional AI mode requires `OPENAI_API_KEY` on the server; see the suite [README](../README.md) for provider configuration and server limits.

## Tests

Run `node --test test/application-logic.test.mjs test/server.test.mjs` from the suite directory. Tests cover source traceability, platform limits, voice/format/CTA behavior, provider response safeguards, and server delivery. No live provider call was made.

## Limitations and deployment

Local templates are deterministic, not live AI output; results are not legal or factual review. AI mode requires a Node-capable host for the API route; static hosting supports only local processing. Keep provider credentials in server-side environment settings. See [suite QA results](../QA_CHECKLIST.md).
