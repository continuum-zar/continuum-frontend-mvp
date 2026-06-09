/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Override API base URL (e.g. `https://api.example.com/api/v1`). Defaults to `/api/v1`. */
    readonly VITE_API_BASE_URL?: string;
    /** Public URL of the hosted MCP server (e.g. `https://continuum-mcp.up.railway.app`). Used to generate the Cursor mcp.json snippet. */
    readonly VITE_MCP_PUBLIC_URL?: string;
    /** OAuth Web client ID for Google Calendar (sprint calendar view). */
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    /** Sentry DSN for the browser SDK. Leave unset to disable Sentry. */
    readonly VITE_SENTRY_DSN?: string;
    /** Sentry environment label (defaults to import.meta.env.MODE). */
    readonly VITE_SENTRY_ENVIRONMENT?: string;
    /** Release identifier surfaced to Sentry; usually the git tag or commit SHA. */
    readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
