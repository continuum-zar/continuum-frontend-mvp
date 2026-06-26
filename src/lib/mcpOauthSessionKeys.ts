/**
 * sessionStorage keys for the MCP OAuth consent flow. Shared between the
 * McpOAuth page (writer) and the auth store's logout cleanup (remover) so the
 * literal values cannot drift apart.
 */
export const MCP_OAUTH_SESSION_KEY = 'continuum-mcp-oauth-completed';
export const MCP_OAUTH_CLIENT_LABEL_KEY = 'continuum-mcp-oauth-client-label';
