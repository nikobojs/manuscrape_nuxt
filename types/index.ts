export {};

declare global {
    interface CurrentUser {
        id: number;
        email: string;
        createdAt: string;
        projects: Project[]
    }

    interface Project {
        id: number;
        name: string;
        fields: ProjectField[];
    }

    interface ProjectField {
        label: string;
        type: string;
    }
}