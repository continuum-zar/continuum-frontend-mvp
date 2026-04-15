import { describe, expect, it } from 'vitest';

import { buildCursorMcpTaskShareUrl } from './cursorMcpShareUrl';

describe('buildCursorMcpTaskShareUrl', () => {
    it('builds an absolute URL whose pathname targets the MCP task route', () => {
        const href = buildCursorMcpTaskShareUrl('https://app.example.com', '42');
        expect(href).toBe('https://app.example.com/cursor-mcp/task/42');
        const u = new URL(href);
        expect(u.pathname).toBe('/cursor-mcp/task/42');
    });

    it('encodes task id segments safely for the path', () => {
        const href = buildCursorMcpTaskShareUrl('http://localhost:5173', 'task-99');
        expect(href).toBe('http://localhost:5173/cursor-mcp/task/task-99');
    });
});
