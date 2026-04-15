# Frontend (Continuum MVP)

This directory holds the Vite + React application. The repository root `README.md` covers install and dev server commands.

## Cursor MCP task URL

Project members can open a read-only **Cursor MCP** task view in the browser and share its URL with Cursor.

1. While signed in, open **`/cursor-mcp/task/<taskId>`** (for example from a deep link or after navigating from the product). The page title and body load task details from `GET /api/v1/tasks/:id/cursor-mcp`.
2. Use **Copy URL** on that page. A tooltip explains that the link is meant to be pasted into Cursor chat. A toast confirms when the URL is on the clipboard.
3. The **MCP task link** block shows the same absolute URL (origin + path) that will be copied, so you can verify it before sharing.
4. Paste the URL into Cursor chat as needed. Opening the URL in a browser (including a new session after signing in again) loads the same task id from the path segment after `/cursor-mcp/task/`.

The share URL is built by `buildCursorMcpTaskShareUrl` in `src/lib/cursorMcpShareUrl.ts`, which must match the router path `/cursor-mcp/task/:taskId` in `src/app/routes.tsx`. Vitest covers the URL shape in `src/lib/cursorMcpShareUrl.test.ts`.
