import { UInput } from ".nuxt/components";
import type { Observation, ObservationDraft, Project, ProjectField, User } from "@prisma/client";
import { Raw } from "nuxt/dist/app/compat/capi";

export {};

declare global {
    interface CurrentUser extends User {
        projects: FullProject[]
    }

    interface FullProject extends Project {
        fields: ProjectField[];
        observations: Observation[];
        observationDrafts: ObservationDraft[];
    }

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
}
