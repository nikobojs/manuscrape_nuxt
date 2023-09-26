import type { Observation, ImageUpload, Project, ProjectField, User, ProjectAccess, ProjectRole, FieldType, DynamicProjectField, FieldOperator, FileUpload } from "@prisma/client";
import type { H3Event } from 'h3';
import { NewProjectSchema } from "~/server/api/projects/index.post";
import type { InferType } from "yup";
import { SignInRequestSchema } from "~/server/api/auth.post";
import { SignUpRequestSchema } from "~/server/api/user.post";

export { };

declare global {
    interface CurrentUser extends User {
        projectAccess: ExtendedProjectAccess[]
    }

    interface ExtendedProjectAccess extends Omit<ProjectAccess, 'userId'> {
        project: Project;
    }

    type FileUploadResponse = Omit<FileUpload, 's3Path'>;

    interface FullObservation extends Observation {
        image: ImageUpload;
        fileUploads: FileUploadResponse[];
        user?: { email: string };
    }

    type FullDynamicProjectField = Omit<DynamicProjectField, 'projectId'>;

    interface DynamicFieldsResponse {
        dynamicFields: FullDynamicProjectField[];
    }

    interface FullProject extends Project {
        fields: ProjectField[];
        dynamicFields: Omit<DynamicProjectField, 'projectId'>[];
        observations: Observation[];
    }

    interface FullImage extends Omit<ImageUpload, 's3Path'> { }

    type NewField = {
        label: string;
        type: FieldType;
        required: boolean;
    };

    type NewDynamicField = {
        label: string;
        field0Id: number;
        field1Id: number;
        operator: FieldOperator,
    };

    interface CMSInputProps {
        type: string;
        name: string;
        placeholder: string;
        step?: number;
    }

    interface CMSCheckboxProps {
        type: 'checkbox';
        name: string;
        label: string;
        checked: boolean;
    }

    interface CMSDropdownProps {
        name: string;
        choices: string[];
    }

    interface CMSTextAreaProps {
        name: string;
    }

    interface CMSRadioGroupProps {
        name: string;
        choices: string[];
    }

    interface CMSInput {
        field: ProjectField;
        props: CMSInputProps | CMSCheckboxProps | CMSDropdownProps | CMSRadioGroupProps | CMSTextAreaProps;
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

    interface IProjectAccess {
        role: string;
        project: {
            id: number;
        }
    }

    interface DropDownConfig {
      choices: string[];
    }

    type NewProjectBody = InferType<typeof NewProjectSchema>;
    type SignInBody = InferType<typeof SignInRequestSchema>;
    type SignUpBody = InferType<typeof SignUpRequestSchema>;
    type DynamicFieldsConfig = {
      [operator in FieldOperator]: {
        pairs: Array<[FieldType, FieldType]>;
      };
    };

}
