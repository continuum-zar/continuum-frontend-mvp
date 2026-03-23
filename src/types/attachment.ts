/** Raw attachment from API (GET /tasks/{taskId}/attachments) */
export interface AttachmentAPIResponse {
    id: number;
    original_filename: string;
    file_size: number;
    mime_type: string;
    /** Set for link attachments */
    url?: string | null;
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
    size: string; // formatted size like "2.4 MB" or "Link"
    mimeType: string;
    /** Set for link attachments; open in new tab */
    url?: string | null;
    createdAt: string;
    uploadedBy?: string;
}
