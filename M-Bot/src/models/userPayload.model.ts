interface UserPayload {
    id: number;
    name: string;
    email: string;
    role: string;
    subscription: string;
    iat: number;
    exp: number;
}

export type { UserPayload as default };