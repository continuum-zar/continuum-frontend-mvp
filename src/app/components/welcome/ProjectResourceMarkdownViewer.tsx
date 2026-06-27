"use client";

/**
 * Inline viewer for AI-planner Markdown resources (plan.md / architecture.md).
 *
 * Downloads the Markdown body via the existing project attachment endpoint, renders
 * it with react-markdown, and lazy-loads Mermaid for ```mermaid``` fenced blocks
 * (architecture.md embeds a flowchart this way).
 */

import { useEffect, useId, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Download, Loader2, X } from "lucide-react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { downloadProjectAttachment, getApiErrorMessage } from "@/api";
import { toast } from "sonner";

// Mermaid is large; load it on demand and only when the viewer actually renders a diagram.
let mermaidConfigured = false;
let mermaidModulePromise: Promise<typeof import("mermaid").default> | null = null;

async function ensureMermaid(): Promise<typeof import("mermaid").default> {
    mermaidModulePromise ??= import("mermaid").then((m) => m.default);
    const mermaid = await mermaidModulePromise;
    if (mermaidConfigured) return mermaid;
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
    });
    mermaidConfigured = true;
    return mermaid;
}

function MermaidDiagram({ code }: { code: string }) {
    const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "-");
    const [svg, setSvg] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setSvg("");
        setError(null);
        if (!code.trim()) return;
        void (async () => {
            try {
                const mermaid = await ensureMermaid();
                const rid = `resource-mmd-${baseId}-${Math.random().toString(36).slice(2)}`;
                const { svg: rendered } = await mermaid.render(rid, code);
                if (!cancelled) setSvg(rendered);
            } catch (e: unknown) {
                if (!cancelled) setError(e instanceof Error ? e.message : String(e));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [code, baseId]);

    if (error) {
        return (
            <div className="my-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/10 p-3 font-mono text-[12px] text-destructive">
                Mermaid render failed: {error}
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-destructive">
                    {code}
                </pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="my-3 flex items-center gap-2 rounded-lg border border-border bg-muted p-3 font-['Satoshi',sans-serif] text-[13px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                Rendering diagram…
            </div>
        );
    }

    return (
        <div
            className="my-3 overflow-x-auto rounded-lg border border-border bg-card p-3"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

const baseText =
    "font-['Inter',sans-serif] text-[14px] font-normal leading-[22px] text-foreground";

const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="mb-3 mt-5 first:mt-0 font-['Satoshi',sans-serif] text-[22px] font-semibold text-foreground">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="mb-2 mt-5 first:mt-0 font-['Satoshi',sans-serif] text-[18px] font-semibold text-foreground">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="mb-2 mt-4 first:mt-0 font-['Satoshi',sans-serif] text-[16px] font-semibold text-foreground">
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4 className="mb-1.5 mt-3 first:mt-0 font-['Satoshi',sans-serif] text-[14px] font-semibold text-foreground">
            {children}
        </h4>
    ),
    p: ({ children }) => <p className={`mb-2 last:mb-0 ${baseText}`}>{children}</p>,
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
    ul: ({ children }) => (
        <ul className="mb-2 ml-5 list-disc space-y-1 marker:text-muted-foreground last:mb-0">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2 ml-5 list-decimal space-y-1 marker:font-medium marker:text-muted-foreground last:mb-0">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className={`${baseText} pl-0.5`}>{children}</li>,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-3 border-border" />,
    table: ({ children }) => (
        <div className="my-3 w-full overflow-x-auto">
            <table className="w-full border-collapse text-left font-['Inter',sans-serif] text-[13px]">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-card text-foreground">{children}</thead>
    ),
    th: ({ children }) => (
        <th className="border-b border-border px-3 py-2 font-semibold">{children}</th>
    ),
    td: ({ children }) => (
        <td className="border-b border-border px-3 py-2 align-top">{children}</td>
    ),
    code: ({ className, children, ...props }) => {
        const lang = /language-(\w+)/.exec(className ?? "")?.[1];
        if (lang === "mermaid") {
            return <MermaidDiagram code={String(children).replace(/\n$/, "")} />;
        }
        const isBlock = Boolean(lang);
        if (isBlock) {
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }
        return (
            <code
                className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground"
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="mb-3 overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-[12px] leading-[18px] text-foreground last:mb-0">
            {children}
        </pre>
    ),
};

function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export interface ProjectResourceMarkdownViewerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachmentId: string;
    title: string;
    suggestedFilename: string;
}

export function ProjectResourceMarkdownViewer({
    open,
    onOpenChange,
    attachmentId,
    title,
    suggestedFilename,
}: ProjectResourceMarkdownViewerProps) {
    const [markdown, setMarkdown] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setMarkdown(null);
        setError(null);
        setDownloadBlob(null);
        setLoading(true);
        void (async () => {
            try {
                const { blob } = await downloadProjectAttachment(attachmentId);
                const text = await blob.text();
                if (!cancelled) {
                    setMarkdown(text);
                    setDownloadBlob(blob);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    setError(getApiErrorMessage(e, "Failed to load resource"));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, attachmentId]);

    const canDownload = useMemo(() => downloadBlob != null, [downloadBlob]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[85vh] w-[min(960px,95vw)] max-w-[960px] flex-col gap-0 overflow-hidden p-0"
                hideClose
            >
                <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border p-4">
                    <DialogTitle className="font-['Satoshi',sans-serif] text-[18px] font-semibold text-foreground">
                        {title}
                    </DialogTitle>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!canDownload}
                            onClick={() => {
                                if (!downloadBlob) return;
                                try {
                                    triggerBlobDownload(downloadBlob, suggestedFilename);
                                } catch (e: unknown) {
                                    toast.error(getApiErrorMessage(e, "Failed to download file"));
                                }
                            }}
                        >
                            <Download className="size-4" strokeWidth={1.75} />
                            Download
                        </Button>
                        <DialogClose asChild>
                            <button
                                type="button"
                                aria-label="Close"
                                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" strokeWidth={1.75} />
                            </button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                <div className="min-h-[200px] flex-1 overflow-y-auto px-6 py-5">
                    {loading ? (
                        <div className="flex items-center gap-2 font-['Satoshi',sans-serif] text-[14px] text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                            Loading resource…
                        </div>
                    ) : error ? (
                        <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/10 p-4 font-['Satoshi',sans-serif] text-[14px] text-destructive">
                            {error}
                        </div>
                    ) : markdown == null ? null : (
                        <div className="w-full min-w-0 [&_*]:break-words">
                            <ReactMarkdown components={markdownComponents}>
                                {markdown}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
