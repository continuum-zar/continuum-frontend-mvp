import { describe, expect, it } from 'vitest';

import { usesBrowserNavigableRedirect } from './McpOAuth';

describe('usesBrowserNavigableRedirect', () => {
    it('returns true for http localhost callbacks (Claude Code)', () => {
        expect(usesBrowserNavigableRedirect('http://127.0.0.1:54321/callback')).toBe(true);
        expect(usesBrowserNavigableRedirect('http://localhost:8080/callback')).toBe(true);
    });

    it('returns true for https callbacks', () => {
        expect(usesBrowserNavigableRedirect('https://app.example.com/oauth/callback')).toBe(true);
    });

    it('returns false for custom editor schemes (Cursor, VS Code)', () => {
        expect(usesBrowserNavigableRedirect('cursor://anysphere.cursor-mcp/oauth/callback')).toBe(false);
        expect(usesBrowserNavigableRedirect('vscode://vscode.github-authentication/mcp/callback')).toBe(false);
    });

    it('returns false for invalid URIs', () => {
        expect(usesBrowserNavigableRedirect('not-a-url')).toBe(false);
        expect(usesBrowserNavigableRedirect('')).toBe(false);
    });
});
