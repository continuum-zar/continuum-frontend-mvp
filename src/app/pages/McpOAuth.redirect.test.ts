import { describe, expect, it } from 'vitest';

import { isAllowedRedirectUrl, usesBrowserNavigableRedirect } from './McpOAuth';

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

describe('isAllowedRedirectUrl', () => {
    it('allows http(s) callbacks (Claude Code localhost, hosted clients)', () => {
        expect(isAllowedRedirectUrl('http://127.0.0.1:54321/callback')).toBe(true);
        expect(isAllowedRedirectUrl('https://app.example.com/oauth/callback')).toBe(true);
    });

    it('allows known IDE deep-link schemes', () => {
        expect(isAllowedRedirectUrl('cursor://anysphere.cursor-mcp/oauth/callback')).toBe(true);
        expect(isAllowedRedirectUrl('vscode://vscode.github-authentication/mcp/callback')).toBe(true);
        expect(isAllowedRedirectUrl('vscode-insiders://vscode.github-authentication/mcp/callback')).toBe(true);
    });

    it('blocks script-execution and data schemes', () => {
        expect(isAllowedRedirectUrl('javascript:alert(1)')).toBe(false);
        expect(isAllowedRedirectUrl('JaVaScRiPt:alert(1)')).toBe(false);
        expect(isAllowedRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
        expect(isAllowedRedirectUrl('blob:https://evil.example/uuid')).toBe(false);
        expect(isAllowedRedirectUrl('file:///etc/passwd')).toBe(false);
    });

    it('blocks unknown custom schemes and invalid URLs', () => {
        expect(isAllowedRedirectUrl('windsurf://callback')).toBe(false);
        expect(isAllowedRedirectUrl('not-a-url')).toBe(false);
        expect(isAllowedRedirectUrl('')).toBe(false);
    });
});
