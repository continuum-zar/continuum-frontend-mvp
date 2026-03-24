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

export function mapMilestone(m: MilestoneAPIResponse): Milestone {
    return {
        id: String(m.id),
        name: m.name ?? '',
        date: formatDueDate(m.due_date ?? ''),
        status: mapMilestoneStatus(m.status ?? 'not_started'),
        desc: m.description ?? undefined,
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

export function mapAttachment(a: AttachmentAPIResponse): Attachment {
    const uploadedBy =
        a.uploaded_by?.display_name ||
        a.uploaded_by?.username ||
        a.uploader?.display_name ||
        (a.uploader?.first_name && a.uploader?.last_name
            ? `${a.uploader.first_name} ${a.uploader.last_name}`.trim()
            : undefined);
    const isLink = !!a.url || a.mime_type === 'application/link';
    return {
        id: String(a.id),
        filename: a.original_filename,
        size: isLink ? 'Link' : formatFileSize(a.file_size),
        mimeType: a.mime_type,
        url: a.url ?? undefined,
        createdAt: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
        uploadedBy: uploadedBy || undefined,
    };
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
