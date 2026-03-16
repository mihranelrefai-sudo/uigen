# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # Install deps + generate Prisma client + run migrations
npm run dev            # Start dev server (Next.js 15 + Turbopack) at localhost:3000
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run all tests (Vitest + jsdom)
npx vitest run src/path/to/file.test.ts  # Run a single test file
npm run db:reset       # Reset and re-migrate the SQLite database (destructive)
```

The dev script requires `NODE_OPTIONS='--require ./node-compat.cjs'` — this is already included in all npm scripts. Don't run `next dev` directly.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat, Claude generates/edits files in a virtual file system, and a live preview renders the result in an iframe — no files are ever written to disk.

### Request flow

1. User submits a message → `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `POST /api/chat` via Vercel AI SDK's `useChat`
2. `src/app/api/chat/route.ts` streams a response from Claude (via `@ai-sdk/anthropic`) with two tools: `str_replace_editor` and `file_manager`
3. Tool calls are streamed back to the client and dispatched to `FileSystemContext.handleToolCall` (`src/lib/contexts/file-system-context.tsx`), which applies them to the in-memory `VirtualFileSystem`
4. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) detects the `refreshTrigger`, compiles all files client-side using Babel standalone + an import map, and injects the result into a sandboxed `<iframe>` via `srcdoc`

### Key abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory tree with `serialize()`/`deserializeFromNodes()` for JSON round-tripping. The serialized form is sent to `/api/chat` on every request so the server can reconstruct the FS state.
- **`FileSystemContext`** / **`ChatContext`** (`src/lib/contexts/`): React contexts that own the FS and chat state. `ChatContext` depends on `FileSystemContext` (must be nested inside it).
- **`jsx-transformer`** (`src/lib/transform/jsx-transformer.ts`): Client-side Babel transform that converts JSX/TSX files into ES modules, builds a blob-URL import map for cross-file imports, and strips CSS imports gracefully.
- **AI tools** (`src/lib/tools/`): `str_replace_editor` (create/str_replace/insert commands) and `file_manager` (rename/delete). The system prompt is in `src/lib/prompts/generation.tsx`.

### Auth & persistence

- JWT sessions via `jose`, stored in an `httpOnly` cookie (`auth-token`). Logic in `src/lib/auth.ts` (server-only).
- Prisma + SQLite (`prisma/dev.db`). Schema: `User` has many `Project`s; a `Project` stores `messages` and `data` (serialized VirtualFileSystem) as JSON strings.
- Anonymous users can use the app freely; their work is tracked in `src/lib/anon-work-tracker.ts` (localStorage) and can be saved on sign-up.
- Only `/api/projects` and `/api/filesystem` routes are auth-protected (see `src/middleware.ts`). `/api/chat` is intentionally public.

### Running without an API key

Set `ANTHROPIC_API_KEY` in `.env`. If absent, `src/lib/provider.ts` returns a mock provider that streams static code — useful for UI development without burning tokens.
