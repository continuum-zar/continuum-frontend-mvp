import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Copy, Check, ArrowLeft, Terminal, Globe } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { WORKSPACE_BASE } from '@/lib/workspacePaths';

const CLAUDE_BRAND_LOGO = '/assets/brand-assets/Claude.svg';
const CURSOR_BRAND_LOGO = '/assets/brand-assets/cursor-logo.svg';

const MCP_PUBLIC_URL = import.meta.env.VITE_MCP_PUBLIC_URL?.replace(/\/+$/, '') || '';

type ClientKind = 'cursor' | 'claude-code';

function buildCursorHostedJson(): string {
    if (!MCP_PUBLIC_URL) return '// Set VITE_MCP_PUBLIC_URL to generate this snippet';
    return JSON.stringify(
        {
            mcpServers: {
                continuum: {
                    url: `${MCP_PUBLIC_URL}/mcp`,
                },
                Figma: {
                    url: 'https://mcp.figma.com/mcp',
                },
            },
        },
        null,
        2,
    );
}

function buildCursorLocalJson(apiBaseUrl: string): string {
    return JSON.stringify(
        {
            mcpServers: {
                continuum: {
                    command: 'npx',
                    args: ['-y', 'continuum-mcp-server@latest'],
                    env: {
                        CONTINUUM_API_BASE_URL: apiBaseUrl || 'https://your-api.example.com/api/v1',
                        CONTINUUM_ACCESS_TOKEN: '<your-jwt-token>',
                    },
                },
                Figma: {
                    url: 'https://mcp.figma.com/mcp',
                },
            },
        },
        null,
        2,
    );
}

function buildClaudeCodeHostedJson(): string {
    if (!MCP_PUBLIC_URL) return '// Set VITE_MCP_PUBLIC_URL to generate this snippet';
    return JSON.stringify(
        {
            mcpServers: {
                continuum: {
                    type: 'http',
                    url: `${MCP_PUBLIC_URL}/mcp`,
                },
                Figma: {
                    type: 'http',
                    url: 'https://mcp.figma.com/mcp',
                },
            },
        },
        null,
        2,
    );
}

function buildClaudeCodeHostedCli(): string {
    if (!MCP_PUBLIC_URL) return '# Set VITE_MCP_PUBLIC_URL to generate this snippet';
    return [
        `claude mcp add --transport http continuum ${MCP_PUBLIC_URL}/mcp`,
        `claude mcp add --transport http Figma https://mcp.figma.com/mcp`,
    ].join('\n');
}

function buildClaudeCodeLocalJson(apiBaseUrl: string): string {
    return JSON.stringify(
        {
            mcpServers: {
                continuum: {
                    command: 'npx',
                    args: ['-y', 'continuum-mcp-server@latest'],
                    env: {
                        CONTINUUM_API_BASE_URL: apiBaseUrl || 'https://your-api.example.com/api/v1',
                        CONTINUUM_ACCESS_TOKEN: '<your-jwt-token>',
                    },
                },
                Figma: {
                    type: 'http',
                    url: 'https://mcp.figma.com/mcp',
                },
            },
        },
        null,
        2,
    );
}

function buildClaudeCodeLocalCli(apiBaseUrl: string): string {
    const apiUrl = apiBaseUrl || 'https://your-api.example.com/api/v1';
    return [
        `claude mcp add continuum \\`,
        `  --env CONTINUUM_API_BASE_URL=${apiUrl} \\`,
        `  --env CONTINUUM_ACCESS_TOKEN=<your-jwt-token> \\`,
        `  -- npx -y continuum-mcp-server@latest`,
        ``,
        `claude mcp add --transport http Figma https://mcp.figma.com/mcp`,
    ].join('\n');
}

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(label ?? 'Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy, try selecting and copying manually.');
        }
    }, [text, label]);

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => void handleCopy()}
            className="gap-1.5"
        >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
        </Button>
    );
}

function CodeBlock({ code }: { code: string }) {
    return (
        <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed">
            <code>{code}</code>
        </pre>
    );
}

function CursorPanels({ apiBaseUrl }: { apiBaseUrl: string }) {
    const hostedJson = useMemo(() => buildCursorHostedJson(), []);
    const localJson = useMemo(() => buildCursorLocalJson(apiBaseUrl), [apiBaseUrl]);
    const hasHosted = !!MCP_PUBLIC_URL;

    return (
        <Tabs defaultValue={hasHosted ? 'hosted' : 'local'}>
            <TabsList className="mb-4">
                <TabsTrigger value="hosted" className="gap-1.5">
                    <Globe className="size-4" />
                    Hosted
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                        Recommended
                    </Badge>
                </TabsTrigger>
                <TabsTrigger value="local" className="gap-1.5">
                    <Terminal className="size-4" />
                    Local
                </TabsTrigger>
            </TabsList>

            <TabsContent value="hosted">
                {hasHosted ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Hosted MCP (OAuth)</CardTitle>
                            <CardDescription className="text-sm">
                                Zero install. Cursor handles Continuum authentication automatically, while Figma provides design context through its hosted MCP.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">mcp.json with Continuum + Figma</p>
                                <CopyButton text={hostedJson} label="MCP config copied — paste it into Cursor settings" />
                            </div>
                            <CodeBlock code={hostedJson} />

                            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm font-medium text-foreground">How to add it</p>
                                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                                    <li>Open Cursor Settings <kbd className="ml-1 rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">Cmd+Shift+J</kbd></li>
                                    <li>Go to <strong>MCP</strong> tab</li>
                                    <li>Click <strong>Add new global MCP server</strong></li>
                                    <li>Paste the JSON above and save</li>
                                    <li>Cursor will open browser windows for the required Continuum and Figma logins</li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Hosted MCP not configured</CardTitle>
                            <CardDescription className="text-sm">
                                The hosted MCP server URL hasn&apos;t been set for this deployment.
                                Ask an admin to set the <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">VITE_MCP_PUBLIC_URL</code> environment variable.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="local">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Local MCP (stdio)</CardTitle>
                        <CardDescription className="text-sm">
                            Runs Continuum on your machine via npx and connects to Figma over its hosted MCP URL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">mcp.json with Continuum + Figma</p>
                            <CopyButton text={localJson} label="MCP config copied — replace the token and paste into Cursor settings" />
                        </div>
                        <CodeBlock code={localJson} />

                        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm font-medium text-foreground">How to add it</p>
                            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                                <li>Copy the JSON above</li>
                                <li>Replace <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">&lt;your-jwt-token&gt;</code> with your token</li>
                                <li>Open Cursor Settings <kbd className="ml-1 rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">Cmd+Shift+J</kbd></li>
                                <li>Go to <strong>MCP</strong> tab</li>
                                <li>Click <strong>Add new global MCP server</strong></li>
                                <li>Paste the JSON and save</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

function ClaudeCodePanels({ apiBaseUrl }: { apiBaseUrl: string }) {
    const hostedJson = useMemo(() => buildClaudeCodeHostedJson(), []);
    const hostedCli = useMemo(() => buildClaudeCodeHostedCli(), []);
    const localJson = useMemo(() => buildClaudeCodeLocalJson(apiBaseUrl), [apiBaseUrl]);
    const localCli = useMemo(() => buildClaudeCodeLocalCli(apiBaseUrl), [apiBaseUrl]);
    const hasHosted = !!MCP_PUBLIC_URL;

    return (
        <Tabs defaultValue={hasHosted ? 'hosted' : 'local'}>
            <TabsList className="mb-4">
                <TabsTrigger value="hosted" className="gap-1.5">
                    <Globe className="size-4" />
                    Hosted
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                        Recommended
                    </Badge>
                </TabsTrigger>
                <TabsTrigger value="local" className="gap-1.5">
                    <Terminal className="size-4" />
                    Local
                </TabsTrigger>
            </TabsList>

            <TabsContent value="hosted">
                {hasHosted ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Hosted MCP (OAuth)</CardTitle>
                            <CardDescription className="text-sm">
                                Zero install. Claude Code handles Continuum authentication automatically on first use, while Figma provides design context through its hosted MCP.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">Install via the Claude Code CLI</p>
                                <CopyButton text={hostedCli} label="CLI command copied — run it in your terminal" />
                            </div>
                            <CodeBlock code={hostedCli} />

                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm font-medium text-foreground">Or paste this into <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">~/.claude.json</code> / <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">.mcp.json</code></p>
                                <CopyButton text={hostedJson} label="MCP config copied" />
                            </div>
                            <CodeBlock code={hostedJson} />

                            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm font-medium text-foreground">How to add it</p>
                                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                                    <li>Run the CLI command above in any project, <em>or</em> paste the JSON into <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">~/.claude.json</code> (user-level) or a project <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">.mcp.json</code></li>
                                    <li>Start Claude Code and invoke any Continuum tool</li>
                                    <li>Claude Code will open a browser for the Continuum and Figma logins</li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Hosted MCP not configured</CardTitle>
                            <CardDescription className="text-sm">
                                The hosted MCP server URL hasn&apos;t been set for this deployment.
                                Ask an admin to set the <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">VITE_MCP_PUBLIC_URL</code> environment variable.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="local">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Local MCP (stdio)</CardTitle>
                        <CardDescription className="text-sm">
                            Runs Continuum on your machine via npx using a Continuum JWT, and connects to Figma over its hosted MCP URL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">Install via the Claude Code CLI</p>
                            <CopyButton text={localCli} label="CLI command copied — replace the token and run it" />
                        </div>
                        <CodeBlock code={localCli} />

                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm font-medium text-foreground">Or paste this into <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">~/.claude.json</code> / <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">.mcp.json</code></p>
                            <CopyButton text={localJson} label="MCP config copied — replace the token before saving" />
                        </div>
                        <CodeBlock code={localJson} />

                        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm font-medium text-foreground">How to add it</p>
                            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                                <li>Replace <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">&lt;your-jwt-token&gt;</code> with your Continuum JWT</li>
                                <li>Run the CLI command, <em>or</em> paste the JSON into <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">~/.claude.json</code> (user-level) or a project <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">.mcp.json</code></li>
                                <li>Restart Claude Code so it picks up the new server</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

function parseClientKind(clientParam: string | undefined): ClientKind | null {
    if (clientParam === 'cursor' || clientParam === 'claude-code') return clientParam;
    return null;
}

const CLIENT_SETUP_META: Record<ClientKind, { title: string; description: string; logoSrc: string }> = {
    cursor: {
        title: 'Cursor MCP',
        description:
            'Connect Cursor to Continuum for tasks and to Figma for design context your AI planner can turn into work.',
        logoSrc: CURSOR_BRAND_LOGO,
    },
    'claude-code': {
        title: 'Claude Code',
        description:
            'Connect Claude Code to Continuum for tasks and to Figma for design context your AI planner can turn into work.',
        logoSrc: CLAUDE_BRAND_LOGO,
    },
};

export function McpSetup() {
    const { client: clientParam } = useParams<{ client: string }>();
    const client = parseClientKind(clientParam);

    if (!client) {
        return <Navigate to="/mcp-setup/cursor" replace />;
    }

    const apiBaseUrl = `${window.location.origin}/api/v1`;
    const meta = CLIENT_SETUP_META[client];

    return (
        <div className="min-h-svh bg-background">
            <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    to={WORKSPACE_BASE}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to workspace
                </Link>

                <div className="mb-8 flex items-start gap-3">
                    <img src={meta.logoSrc} alt="" aria-hidden className="mt-1 size-8 shrink-0" />
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{meta.title}</h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">{meta.description}</p>
                    </div>
                </div>

                {client === 'cursor' ? (
                    <CursorPanels apiBaseUrl={apiBaseUrl} />
                ) : (
                    <ClaudeCodePanels apiBaseUrl={apiBaseUrl} />
                )}
            </div>
        </div>
    );
}

/** Legacy path: redirect to Cursor setup. */
export function McpSetupRedirect() {
    return <Navigate to="/mcp-setup/cursor" replace />;
}
