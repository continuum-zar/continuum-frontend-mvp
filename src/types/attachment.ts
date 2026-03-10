/** Raw attachment from API (GET /tasks/{taskId}/attachments) */
export interface AttachmentAPIResponse {
    id: number;
    original_filename: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    uploaded_by?: {
        id: number;
        username: string;
        display_name?: string;
    };
}

/** Attachment shape used by UI */
export interface Attachment {
    id: string;
    filename: string;
    size: string; // formatted size like "2.4 MB"
    mimeType: string;
    createdAt: string;
    uploadedBy?: string;
}
