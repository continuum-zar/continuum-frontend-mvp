export interface CommentAuthorAPI {
    id: number;
    display_name?: string | null;
    username?: string | null;
}

export interface CommentAPIResponse {
    id: number;
    content: string;
    author: CommentAuthorAPI;
    created_at: string;
}
