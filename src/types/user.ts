export interface RegisterPayload {
    first_name: string;
    last_name: string;
    email: string;
    password?: string;
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
}
