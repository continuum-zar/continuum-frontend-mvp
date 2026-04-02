/** Raw attachment from API (GET /tasks/{taskId}/attachments) */
export interface AttachmentAPIResponse {
    id: number;
    /** File name, or link label; some APIs also use `display_name` / `name` for links */
    original_filename: string;
    display_name?: string | null;
    name?: string | null;
    title?: string | null;
    file_size: number;
    mime_type: string;
    /** Set for link attachments */
    url?: string | null;
    /** Some backends expose the target URL under a different key */
    link_url?: string | null;
    source_url?: string | null;
    external_url?: string | null;
    resource_url?: string | null;
    target_url?: string | null;
    /** Explicit type flags from API */
    is_link?: boolean | null;
    attachment_type?: string | null;
    created_at: string;
    /** Some APIs return uploaded_by */
    uploaded_by?: {
        id: number;
        username?: string;
        display_name?: string;
    };
    /** Backend list returns uploader */
    uploader?: {
        id: number;
        display_name?: string | null;
        first_name?: string;
        last_name?: string;
    };
}

/** Attachment shape used by UI */
export interface Attachment {
    id: string;
    filename: string;
    /** Formatted size for files; empty for links (second line hidden in UI) */
    size: string;
    mimeType: string;
    kind: 'file' | 'link';
    /** Resolved target URL for link attachments (for open + display) */
    url?: string | null;
    createdAt: string;
    uploadedBy?: string;
}
