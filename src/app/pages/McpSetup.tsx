import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Copy, Check, ArrowLeft, Terminal, Globe } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { WORKSPACE_BASE } from '@/lib/workspacePaths';

const MCP_PUBLIC_URL = import.meta.env.VITE_MCP_PUBLIC_URL?.replace(/\/+$/, '') || '';

function buildHostedJson(): string {
    if (!MCP_PUBLIC_URL) return '// Set VITE_MCP_PUBLIC_URL to generate this snippet';
    return JSON.stringify(
        {
            mcpServers: {
                continuum: {
                    url: `${MCP_PUBLIC_URL}/mcp`,
                },
            },
        },
        null,
        2,
    );
}

function buildLocalJson(apiBaseUrl: string): string {
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
            },
        },
        null,
        2,
    );
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

export function McpSetup() {
    const apiBaseUrl = `${window.location.origin}/api/v1`;

    const hostedJson = useMemo(() => buildHostedJson(), []);
    const localJson = useMemo(() => buildLocalJson(apiBaseUrl), [apiBaseUrl]);

    const hasHosted = !!MCP_PUBLIC_URL;

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

                <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Cursor MCP Setup
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Connect Cursor to Continuum so your AI agent can pull tasks, update checklists, and change statuses.
                    </p>
                </div>

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
                                        Zero install. Cursor handles authentication automatically — just paste and go.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-foreground">mcp.json</p>
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
                                            <li>Cursor will open a browser window for you to log in</li>
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
                                    Runs on your machine via npx. Requires Node.js and a personal access token.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-foreground">mcp.json</p>
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
            </div>
        </div>
    );
}
