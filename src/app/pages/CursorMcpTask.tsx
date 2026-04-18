import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { format, parseISO } from 'date-fns';
import { isAxiosError } from 'axios';
import { Copy, Check, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { CursorMcpTaskDetail } from '@/api/cursorMcp';
import { useCursorMcpTaskDetail, getApiErrorMessage } from '@/api/hooks';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { buildCursorMcpTaskShareUrl } from '@/lib/cursorMcpShareUrl';
import { workspaceJoin } from '@/lib/workspacePaths';
import type { CommentAuthorAPI } from '@/types/comment';

function authorLabel(author: CommentAuthorAPI): string {
    const name = [author.display_name, author.username].filter(Boolean).join(' — ');
    return name || `User ${author.id}`;
}

function safeFormatCommentTime(iso: string): string {
    try {
        const d = parseISO(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return format(d, 'yyyy-MM-dd HH:mm');
    } catch {
        return iso;
    }
}

export function CursorMcpTask() {
    const { taskId } = useParams<{ taskId: string }>();
    const { data, isLoading, isError, error, refetch, isFetching } = useCursorMcpTaskDetail(taskId);
    const [copied, setCopied] = useState(false);

    const shareUrl = useMemo(() => {
        if (typeof window === 'undefined' || !taskId) return '';
        return buildCursorMcpTaskShareUrl(window.location.origin, taskId);
    }, [taskId]);

    const handleCopyUrl = useCallback(async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copied, paste it into Cursor chat to open this task view.');
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy to clipboard');
        }
    }, [shareUrl]);

    const errorMessage = useMemo(() => {
        if (!isError || !error) return 'Something went wrong while loading this task.';
        return getApiErrorMessage(error, 'Unable to load task details.');
    }, [isError, error]);

    if (!taskId) {
        return (
            <div className="min-h-svh bg-background px-4 py-10 text-foreground">
                <Alert variant="destructive" className="mx-auto max-w-2xl">
                    <AlertTitle>Missing task</AlertTitle>
                    <AlertDescription>No task id was provided in the URL.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-svh bg-background text-foreground">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:py-10">
                <header className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                            <p className="text-muted-foreground text-sm font-medium tracking-tight">Cursor MCP</p>
                            {isLoading ? (
                                <Skeleton className="h-8 w-[min(100%,320px)] max-w-full" />
                            ) : data ? (
                                <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
                                    {data.task.title}
                                </h1>
                            ) : (
                                <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
                                    Task {taskId}
                                </h1>
                            )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleCopyUrl}
                                        disabled={!shareUrl}
                                        aria-label={copied ? 'URL copied to clipboard' : 'Copy Cursor MCP task URL'}
                                    >
                                        {copied ? (
                                            <Check className="size-4" aria-hidden />
                                        ) : (
                                            <Copy className="size-4" aria-hidden />
                                        )}
                                        {copied ? 'Copied' : 'Copy URL'}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs text-balance">
                                    {`Copies this page's URL for sharing. For full Cursor agent integration (pull tasks, update checklists, change status), configure the Continuum MCP server.`}
                                </TooltipContent>
                            </Tooltip>
                            <Button type="button" variant="ghost" size="sm" asChild>
                                <Link to={workspaceJoin('task', taskId)} className="gap-2">
                                    <Link2 className="size-4" aria-hidden />
                                    Open in app
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="border-border bg-muted/30 flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-muted-foreground text-xs font-medium tracking-tight">
                                MCP task link (same URL you copy)
                            </p>
                            {shareUrl ? (
                                <p
                                    className="text-foreground font-mono text-sm leading-snug break-all select-all"
                                    title={shareUrl}
                                >
                                    {shareUrl}
                                </p>
                            ) : (
                                <Skeleton className="h-5 w-full max-w-md" />
                            )}
                        </div>
                    </div>
                </header>

                {isLoading && (
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                )}

                {isError && !isLoading && (
                    <Alert variant="destructive">
                        <AlertTitle>Could not load task</AlertTitle>
                        <AlertDescription className="space-y-3">
                            <p>{errorMessage}</p>
                            {isAxiosError(error) && error.response?.status === 404 && (
                                <p className="text-sm opacity-90">
                                    The task may not exist, or the Cursor MCP endpoint may not be available on this
                                    environment yet.
                                </p>
                            )}
                            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                                {isFetching ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" aria-hidden />
                                        Retrying…
                                    </>
                                ) : (
                                    'Try again'
                                )}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {data && !isLoading && (
                    <CursorMcpTaskBody data={data} />
                )}
            </div>
        </div>
    );
}

function CursorMcpTaskBody({ data }: { data: CursorMcpTaskDetail }) {
    const sortedComments = useMemo(
        () =>
            [...data.comments].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            ),
        [data.comments],
    );

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                    <CardDescription className="text-muted-foreground font-normal">
                        Plain text suitable for selecting and copying into Cursor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.task.description?.trim() ? (
                        <pre className="border-border bg-muted/40 text-foreground max-h-[min(70vh,520px)] overflow-auto rounded-md border p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                            {data.task.description}
                        </pre>
                    ) : (
                        <p className="text-muted-foreground text-sm">No description.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.task.checklists && data.task.checklists.length > 0 ? (
                        <ul className="space-y-2">
                            {data.task.checklists.map((item, index) => (
                                <li
                                    key={item.id ?? `${index}-${item.text}`}
                                    className="border-border flex gap-3 rounded-md border px-3 py-2 text-sm"
                                >
                                    <span className="text-muted-foreground font-mono shrink-0">
                                        [{item.done ? 'x' : ' '}]
                                    </span>
                                    <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-sm">No checklist items.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Branch</CardTitle>
                    <CardDescription className="text-muted-foreground font-normal">
                        Linked repository and branch for this task.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.task.linked_repo || data.task.linked_branch || data.task.linked_branch_full_ref ? (
                        <dl className="space-y-3 text-sm">
                            {data.task.linked_repo ? (
                                <div>
                                    <dt className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                                        Repository
                                    </dt>
                                    <dd className="font-mono break-all">{data.task.linked_repo}</dd>
                                </div>
                            ) : null}
                            {data.task.linked_branch ? (
                                <div>
                                    <dt className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                                        Branch
                                    </dt>
                                    <dd className="font-mono break-all">{data.task.linked_branch}</dd>
                                </div>
                            ) : null}
                            {data.task.linked_branch_full_ref ? (
                                <div>
                                    <dt className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                                        Full ref
                                    </dt>
                                    <dd className="font-mono break-all">{data.task.linked_branch_full_ref}</dd>
                                </div>
                            ) : null}
                        </dl>
                    ) : (
                        <p className="text-muted-foreground text-sm">No branch linked.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Comments</CardTitle>
                    <CardDescription className="text-muted-foreground font-normal">
                        {data.comments.length === 0
                            ? 'No comments on this task.'
                            : `${data.comments.length} comment${data.comments.length === 1 ? '' : 's'}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedComments.length > 0 ? (
                        <ul className="divide-border divide-y rounded-md border">
                            {sortedComments.map((c) => (
                                <li key={c.id} className="space-y-2 px-4 py-4 first:pt-3 last:pb-3">
                                    <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
                                        <span className="text-foreground font-medium">{authorLabel(c.author)}</span>
                                        <span aria-hidden className="text-muted-foreground/60">
                                            ·
                                        </span>
                                        <time dateTime={c.created_at}>{safeFormatCommentTime(c.created_at)}</time>
                                    </div>
                                    <pre className="text-foreground max-w-full overflow-x-auto text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                        {c.content}
                                    </pre>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
