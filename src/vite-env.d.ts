/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Override API base URL (e.g. `https://api.example.com/api/v1`). Defaults to `/api/v1`. */
    readonly VITE_API_BASE_URL?: string;
    /** Public URL of the hosted MCP server (e.g. `https://continuum-mcp.up.railway.app`). Used to generate the Cursor mcp.json snippet. */
    readonly VITE_MCP_PUBLIC_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
