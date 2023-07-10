export {};

declare global {
    interface CurrentUser {
        id: number;
        email: string;
        createdAt: string;
    }
}