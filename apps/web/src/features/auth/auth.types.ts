export interface User {
    id: number;
    email: string;
    name: string;
    createdAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    acceptedTerms: boolean;
    /** Link que trouxe a pessoa ao cadastro, quando houver. */
    sharedPlanToken?: string;
}

export interface RegisterResponse {
    id: number;
    email: string;
    name: string;
}