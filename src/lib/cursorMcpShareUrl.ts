/**
 * Canonical share URL for the Cursor MCP task view.
 * Must stay in sync with the route `path: "/cursor-mcp/task/:taskId"` in `routes.tsx`.
 */
export function buildCursorMcpTaskShareUrl(origin: string, taskId: string): string {
    const path = `/cursor-mcp/task/${encodeURIComponent(taskId)}`;
    return new URL(path, origin).href;
}
