export interface CommentAuthorAPI {
    id: number;
    display_name?: string | null;
    username?: string | null;
}

export interface CommentMentionUserAPI {
    id: number;
    username?: string | null;
    display_name?: string | null;
}

export interface CommentAPIResponse {
    id: number;
    content: string;
    author: CommentAuthorAPI;
    mentions?: CommentMentionUserAPI[];
    created_at: string;
}
