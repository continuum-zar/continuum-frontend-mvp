import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Copy, Check, ArrowLeft, Globe } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/app/components/ui/utils';
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
            },
        },
        null,
        2,
    );
}

function buildClaudeCodeHostedCli(): string {
    if (!MCP_PUBLIC_URL) return '# Set VITE_MCP_PUBLIC_URL to generate this snippet';
    return `claude mcp add --transport http continuum ${MCP_PUBLIC_URL}/mcp`;
}

// Shared, app-consistent presentational primitives (Satoshi type, neutral palette).
const cardClass = 'rounded-[12px] border border-[#ebedee] bg-white p-6';
const cardTitleClass = "font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]";
const cardDescClass = "font-['Satoshi',sans-serif] text-[14px] font-normal leading-normal text-[#606d76]";
const fieldLabelClass = "font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]";
const inlineCodeClass =
    "rounded-[4px] border border-[#ebedee] bg-[#f9fafb] px-1.5 py-0.5 font-mono text-[12px] text-[#0b191f]";
const kbdClass =
    "ml-1 rounded-[4px] border border-[#ebedee] bg-[#f9fafb] px-1.5 py-0.5 font-mono text-[12px] text-[#0b191f]";

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
        <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#ebedee] bg-white px-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] outline-none ring-offset-2 transition-colors hover:bg-[#f9f9f9] focus-visible:ring-2 focus-visible:ring-ring"
        >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

function CodeBlock({ code }: { code: string }) {
    return (
        <pre className="overflow-x-auto rounded-[8px] border border-[#ebedee] bg-[#f9fafb] p-4 font-mono text-[13px] leading-relaxed text-[#0b191f]">
            <code>{code}</code>
        </pre>
    );
}

function HowToBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 rounded-[8px] border border-[#ebedee] bg-[#f9fafb] p-4">
            <p className={fieldLabelClass}>How to add it</p>
            <ol className="list-inside list-decimal space-y-1 font-['Satoshi',sans-serif] text-[14px] font-normal leading-normal text-[#606d76]">
                {children}
            </ol>
        </div>
    );
}

function CursorPanels() {
    const hostedJson = useMemo(() => buildCursorHostedJson(), []);
    const hasHosted = !!MCP_PUBLIC_URL;

    if (!hasHosted) {
        return (
            <div className={cn(cardClass, 'flex flex-col gap-1.5')}>
                <p className={cardTitleClass}>Hosted MCP not configured</p>
                <p className={cardDescClass}>
                    The hosted MCP server URL hasn&apos;t been set for this deployment.
                    Ask an admin to set the <code className={inlineCodeClass}>VITE_MCP_PUBLIC_URL</code> environment variable.
                </p>
            </div>
        );
    }

    return (
        <div className={cn(cardClass, 'flex flex-col gap-4')}>
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <Globe className="size-4 text-[#0b191f]" />
                    <p className={cardTitleClass}>Hosted MCP (OAuth)</p>
                </div>
                <p className={cardDescClass}>
                    Zero install. Cursor handles Continuum authentication automatically on first use.
                </p>
            </div>
            <div className="flex items-center justify-between gap-3">
                <p className={fieldLabelClass}>mcp.json with Continuum</p>
                <CopyButton text={hostedJson} label="MCP config copied — paste it into Cursor settings" />
            </div>
            <CodeBlock code={hostedJson} />

            <HowToBox>
                <li>Open Cursor Settings <kbd className={kbdClass}>Cmd+Shift+J</kbd></li>
                <li>Go to <strong className="font-medium text-[#0b191f]">MCP</strong> tab</li>
                <li>Click <strong className="font-medium text-[#0b191f]">Add new global MCP server</strong></li>
                <li>Paste the JSON above and save</li>
                <li>Cursor will open a browser window for the Continuum login</li>
            </HowToBox>
        </div>
    );
}

function ClaudeCodePanels() {
    const hostedJson = useMemo(() => buildClaudeCodeHostedJson(), []);
    const hostedCli = useMemo(() => buildClaudeCodeHostedCli(), []);
    const hasHosted = !!MCP_PUBLIC_URL;

    if (!hasHosted) {
        return (
            <div className={cn(cardClass, 'flex flex-col gap-1.5')}>
                <p className={cardTitleClass}>Hosted MCP not configured</p>
                <p className={cardDescClass}>
                    The hosted MCP server URL hasn&apos;t been set for this deployment.
                    Ask an admin to set the <code className={inlineCodeClass}>VITE_MCP_PUBLIC_URL</code> environment variable.
                </p>
            </div>
        );
    }

    return (
        <div className={cn(cardClass, 'flex flex-col gap-4')}>
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <Globe className="size-4 text-[#0b191f]" />
                    <p className={cardTitleClass}>Hosted MCP (OAuth)</p>
                </div>
                <p className={cardDescClass}>
                    Zero install. Claude Code handles Continuum authentication automatically on first use.
                </p>
            </div>
            <div className="flex items-center justify-between gap-3">
                <p className={fieldLabelClass}>Install via the Claude Code CLI</p>
                <CopyButton text={hostedCli} label="CLI command copied — run it in your terminal" />
            </div>
            <CodeBlock code={hostedCli} />

            <div className="flex items-center justify-between gap-3 pt-2">
                <p className={fieldLabelClass}>Or paste this into <code className={inlineCodeClass}>~/.claude.json</code> / <code className={inlineCodeClass}>.mcp.json</code></p>
                <CopyButton text={hostedJson} label="MCP config copied" />
            </div>
            <CodeBlock code={hostedJson} />

            <HowToBox>
                <li>Run the CLI command above in any project, <em>or</em> paste the JSON into <code className={inlineCodeClass}>~/.claude.json</code> (user-level) or a project <code className={inlineCodeClass}>.mcp.json</code></li>
                <li>Start Claude Code and invoke any Continuum tool</li>
                <li>Claude Code will open a browser for the Continuum login</li>
            </HowToBox>
        </div>
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
            'Connect Cursor to Continuum so your AI agent can pull tasks, update checklists, and change statuses.',
        logoSrc: CURSOR_BRAND_LOGO,
    },
    'claude-code': {
        title: 'Claude Code',
        description:
            'Connect Claude Code to Continuum so your AI agent can pull tasks, update checklists, and change statuses.',
        logoSrc: CLAUDE_BRAND_LOGO,
    },
};

export function McpSetup() {
    const { client: clientParam } = useParams<{ client: string }>();
    const client = parseClientKind(clientParam);

    if (!client) {
        return <Navigate to="/mcp-setup/cursor" replace />;
    }

    const meta = CLIENT_SETUP_META[client];

    return (
        <div className="min-h-svh bg-[#f9fafb]">
            <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    to={WORKSPACE_BASE}
                    className="mb-6 inline-flex items-center gap-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76] transition-colors hover:text-[#0b191f]"
                >
                    <ArrowLeft className="size-4" />
                    Back to workspace
                </Link>

                <div className="mb-8 flex items-start gap-3 border-b border-[#ebedee] pb-6">
                    <img src={meta.logoSrc} alt="" aria-hidden className="mt-1 size-8 shrink-0" />
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <h1 className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">{meta.title}</h1>
                        <p className="font-['Satoshi',sans-serif] text-[14px] font-normal leading-normal text-[#606d76]">{meta.description}</p>
                    </div>
                </div>

                {client === 'cursor' ? <CursorPanels /> : <ClaudeCodePanels />}
            </div>
        </div>
    );
}

/** Legacy path: redirect to Cursor setup. */
export function McpSetupRedirect() {
    return <Navigate to="/mcp-setup/cursor" replace />;
}
