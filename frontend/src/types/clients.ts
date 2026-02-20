export interface Client {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    assigned_user_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateClientRequest {
    email: string;
    first_name: string;
    last_name: string;
}

export interface ClientNote {
    id: string;
    client_id: string;
    creator_user_id: string;
    content: string;
    created_at: string;
}

export interface CreateClientNoteRequest {
    content: string;
}
