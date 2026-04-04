import { formatDistanceToNow } from 'date-fns';
import type { AttachmentAPIResponse, Attachment } from "@/types/attachment";
import type { ProjectAPIResponse, Project } from '@/types/project';
import type { ProjectDetailAPIResponse, ProjectDetail } from '@/types/project';
import type { TaskAPIResponse, Task, TaskStatus } from '@/types/task';
import type { MilestoneAPIResponse, Milestone, MilestoneStatus } from '@/types/milestone';
import type { MemberAPIResponse, Member } from '@/types/member';
import type { InvoiceAPIResponse, Invoice } from '@/types/invoice';

/** Canonical project status for list UI (matches filter keys and PUT body). */
export function normalizeProjectStatus(raw: string | undefined | null): Project['status'] {
    const s = (raw ?? 'active').trim();
    const key = s.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
    if (key === 'active') return 'active';
    if (key === 'completed') return 'completed';
    if (key === 'on_hold' || key === 'onhold') return 'on_hold';
    return s;
}

export function mapProjectListItem(p: ProjectAPIResponse): Project {
    const lastActiveRaw = p.last_active ?? p.updated_at;
    return {
        id: String(p.id),
        apiId: p.id,
        title: p.name,
        description: p.description ?? 'No description provided.',
        status: normalizeProjectStatus(p.status),
        progress: p.progress ?? p.progress_percentage ?? 0,
        dueDate: p.due_date ?? 'No Date',
        teamSize: p.team_size ?? p.member_count ?? 1,
        lastActive: lastActiveRaw
            ? formatDistanceToNow(new Date(lastActiveRaw), { addSuffix: true })
            : 'Unknown',
        clientId: p.client_id,
        memberRole: p.member_role ?? undefined,
    };
}

export function mapProjectDetail(res: ProjectDetailAPIResponse): ProjectDetail {
    return {
        id: res.id,
        name: res.name ?? `Project ${res.id}`,
        description: res.description ?? 'Track progress and manage tasks for the project',
    };
}

function mapTaskStatus(s: string): TaskStatus {
    if (s === 'in_progress') return 'in-progress';
    if (s === 'todo' || s === 'done') return s;
    return 'todo';
}

export function mapTask(t: TaskAPIResponse): Task {
    let totalChecklists = 0;
    let completedChecklists = 0;
    if (t.checklists && Array.isArray(t.checklists)) {
        totalChecklists = t.checklists.length;
        completedChecklists = t.checklists.filter((c) => c.done).length;
    }
    return {
        id: String(t.id),
        title: t.title ?? '',
        description: t.description ?? '',
        status: mapTaskStatus(t.status ?? 'todo'),
        scope: t.scope_weight ?? 'M',
        assignees: t.assigned_to != null ? [String(t.assigned_to)] : [],
        attachments: t.attachment_count ?? 0,
        comments: t.comment_count ?? 0,
        checklists: { total: totalChecklists, completed: completedChecklists },
        milestoneId: t.milestone_id != null ? String(t.milestone_id) : '',
    };
}

export function mapMilestoneStatus(s: string): MilestoneStatus {
    switch (s) {
        case 'in_progress':
            return 'active';
        case 'completed':
            return 'completed';
        case 'overdue':
            return 'overdue';
        default:
            return 'upcoming';
    }
}

export function formatDueDate(iso: string): string {
    if (!iso) return 'No date';
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/** Display estimated hours as "1 hour" / "3.5 hours" (not "h"). */
export function formatEstimatedEffortLabel(hours: number): string {
    const n = Number(hours);
    if (!Number.isFinite(n)) return '';
    return `${n} ${n === 1 ? 'hour' : 'hours'}`;
}

export function mapMilestone(m: MilestoneAPIResponse): Milestone {
    return {
        id: String(m.id),
        name: m.name ?? '',
        date: formatDueDate(m.due_date ?? ''),
        status: mapMilestoneStatus(m.status ?? 'not_started'),
        desc: m.description ?? undefined,
        dueDateIso: m.due_date ?? null,
    };
}

export function mapMember(m: MemberAPIResponse): Member {
    const user = m.user;
    const firstName = user?.first_name ?? m.first_name ?? '';
    const lastName = user?.last_name ?? m.last_name ?? '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
    const email = user?.email ?? m.email ?? '';
    const initials =
        [firstName, lastName]
            .map((s) => (s && s[0]) || '')
            .join('')
            .toUpperCase()
            .slice(0, 2) || (email ? email[0].toUpperCase() : '?');
    return {
        id: m.id,
        userId: m.user_id,
        name,
        email,
        role: m.role ?? 'developer',
        userRole: (m.user as { role?: string } | undefined)?.role,
        initials,
    };
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function looksLikeHttpUrl(s: string): boolean {
    return /^https?:\/\//i.test(s.trim());
}

/** Pull URL from API attachment — list endpoints often use different keys than `url`. */
function firstNonEmptyUrl(a: AttachmentAPIResponse): string | undefined {
    const x = a as AttachmentAPIResponse &
        Record<string, unknown> & {
            linkUrl?: string | null;
            href?: string | null;
            uri?: string | null;
            attachment_url?: string | null;
            remote_url?: string | null;
            link_address?: string | null;
            web_url?: string | null;
            metadata?: { url?: string | null; link?: string | null };
        };

    const ordered: Array<string | null | undefined> = [
        a.url,
        a.link_url,
        a.source_url,
        a.external_url,
        a.resource_url,
        a.target_url,
        x.linkUrl,
        x.href,
        x.uri,
        x.attachment_url,
        x.remote_url,
        x.link_address,
        x.web_url,
    ];
    for (const c of ordered) {
        if (c == null) continue;
        const s = String(c).trim();
        if (s !== '') return s;
    }

    const meta = x.metadata;
    if (meta && typeof meta === 'object') {
        const m = meta as Record<string, unknown>;
        for (const k of ['url', 'link', 'href', 'uri']) {
            const v = m[k];
            if (typeof v === 'string' && v.trim() !== '') return v.trim();
        }
    }

    // Last resort: any string field on the payload that looks like a web URL
    for (const [, v] of Object.entries(x)) {
        if (typeof v !== 'string') continue;
        const s = v.trim();
        if (looksLikeHttpUrl(s)) return s;
    }

    return undefined;
}

function inferLinkKind(a: AttachmentAPIResponse, resolvedUrl: string | undefined): boolean {
    if (resolvedUrl) return true;
    if (a.is_link === true) return true;
    const camel = a as AttachmentAPIResponse & { isLink?: boolean | null };
    if (camel.isLink === true) return true;
    const t = (a.attachment_type ?? '').toLowerCase();
    if (t === 'link' || t === 'url') return true;
    const mime = (a.mime_type ?? '').toLowerCase();
    if (
        mime === 'application/link' ||
        mime === 'text/uri-list' ||
        mime === 'application/x-url' ||
        mime === 'message/external-body'
    ) {
        return true;
    }
    return false;
}

export function mapAttachment(a: AttachmentAPIResponse): Attachment {
    const uploadedBy =
        a.uploaded_by?.display_name ||
        a.uploaded_by?.username ||
        a.uploader?.display_name ||
        (a.uploader?.first_name && a.uploader?.last_name
            ? `${a.uploader.first_name} ${a.uploader.last_name}`.trim()
            : undefined);
    let resolvedUrl = firstNonEmptyUrl(a);
    const isLink = inferLinkKind(a, resolvedUrl);
    const fn = a.original_filename?.trim() ?? '';
    if (isLink && !resolvedUrl && looksLikeHttpUrl(fn)) {
        resolvedUrl = fn;
    }

    const explicitLabel =
        a.display_name?.trim() || a.name?.trim() || a.title?.trim() || '';
    const filename = explicitLabel || a.original_filename;
    return {
        id: String(a.id),
        filename,
        size: isLink ? '' : formatFileSize(a.file_size),
        mimeType: a.mime_type,
        kind: isLink ? 'link' : 'file',
        url: resolvedUrl,
        createdAt: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
        uploadedBy: uploadedBy || undefined,
    };
}

/**
 * Href for `<a>` tags — uses mapped `url`, or falls back to URL-shaped `filename` for link rows.
 * (Welcome mock uses `item.url` directly; real APIs are inconsistent.)
 */
export function getAttachmentLinkHref(att: Attachment): string | undefined {
    const u = att.url?.trim();
    if (u && looksLikeHttpUrl(u)) return u;
    if (att.kind === 'link') {
        const f = att.filename?.trim() ?? '';
        if (looksLikeHttpUrl(f)) return f;
    }
    return undefined;
}

/**
 * Visible label for link attachments: prefer human display text (`filename`) over showing the raw URL.
 */
export function getAttachmentLinkLabel(att: Attachment): string {
    const href = getAttachmentLinkHref(att);
    const name = att.filename?.trim() ?? '';
    if (name && !looksLikeHttpUrl(name)) return name;
    if (href) return href;
    return name || 'Link';
}

export function mapInvoice(inv: InvoiceAPIResponse, projectNameMap?: Map<number, string>): Invoice {
    const statusMap: Record<InvoiceAPIResponse['status'], Invoice['status']> = {
        draft: 'draft',
        sent: 'pending',
        paid: 'paid',
        overdue: 'overdue',
        cancelled: 'draft', // Mapping cancelled to draft or similar if no direct match
    };

    return {
        id: String(inv.id),
        number: inv.invoice_number,
        client: inv.client_name || inv.project_name || (projectNameMap?.get(inv.project_id)) || `Project ${inv.project_id}`,
        amount: inv.total,
        status: statusMap[inv.status] || 'pending',
        issueDate: inv.billing_period_start || inv.created_at,
        dueDate: inv.billing_period_end,
    };
}
