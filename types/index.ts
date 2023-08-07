import { Project, ProjectField, User } from "@prisma/client";

export {};

declare global {
    interface CurrentUser extends User {
        projects: FullProject[]
    }

    interface FullProject extends Project {
        fields: Field[];
    }

    interface Field extends ProjectField {
    }

    type NewField = Omit<Omit<Omit<Omit<ProjectField, 'id'>, 'projectId'>, 'dynamicFields0'>, 'dynamicFields1'>
}