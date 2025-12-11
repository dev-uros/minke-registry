export interface AppStore {
    servers: Server[]
    tags: string[]
}

export interface Server {
    user: string,
    ip: string,
    note: string,
    password: string,
    tags: string[]
}
export interface AuthResponse {
    success: boolean,
    message: string
}
