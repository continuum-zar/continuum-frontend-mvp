/** Matches backend `app.schemas.common.PaginatedResponse` for list endpoints. */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    skip: number;
    limit: number;
}
