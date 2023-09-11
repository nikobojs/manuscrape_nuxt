import { UInput } from "#build/components";
import type { Observation, ImageUpload, Project, ProjectField, User, ProjectAccess, ProjectRole } from "@prisma/client";
import { Raw } from "nuxt/dist/app/compat/capi";
import type { H3Event } from 'h3';

export {};

declare global {
    interface CurrentUser extends User {
        projectAccess: ExtendedProjectAccess[]
    }

    interface ExtendedProjectAccess extends Omit<ProjectAccess, 'userId'> {
        project: Project;
    }

    interface FullObservation extends Observation {
        image: ImageUpload;
    }

    interface FullProject extends Project {
        fields: ProjectField[];
        observations: Observation[];
    }

    interface FullImage extends Omit<ImageUpload, 's3Path'> {}

    // TODO: extract type from zod validation object instead
    type NewField = Omit<
        Omit<
            Omit<
                Omit<
                    Omit<ProjectField,'id'>,
                    'createdAt'
                >, 'projectId'
            >, 'dynamicFields0'
        >, 'dynamicFields1'
    >;

    interface CMSInputProps {
        type: string;
        name: string;
        placeholder: string;
        step?: number;
    }

    interface CMSInput {
        field: ProjectField;
        props: CMSInputProps;
        element: Raw<typeof UInput>;
    }

    interface Window {
      electronAPI?: any;
    }

    interface TokenResponse {
      token: string;
    }

    interface UserInSession {
        id: number;
        projectAccess: {
            projectId: number;
            role: ProjectRole;
        }[]
    }

    interface Breadcrumb {
        url: string;
        text: string;
    }

    type Square = [x: number, y: number, w: number, h: number];

    interface QueryParamOptions<T> {
        name: string;
        event: H3Event;
        defaultValue?: T;
        parse: (value: string) => T;
        validate: (parsed: T) => boolean;
        required?: boolean;
    }
}
