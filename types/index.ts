import type {
  DynamicProjectField,
  
  FieldOperator,
  FieldType,
  FileUpload,
  ImageUpload,
  Observation,
  Project,
  ProjectAccess,
  ProjectField,
  ProjectRole,
  User,
} from "@prisma/client";
import type { H3Event } from "h3";
import { NewProjectFieldSchema, NewProjectSchema } from "~/server/api/projects/index.post";
import type { InferType } from "yup";
import { SignInRequestSchema } from "~/server/api/auth.post";
import { SignUpRequestSchema } from "~/server/api/user.post";

export {};

declare global {
  interface CurrentUser extends User {
    projectAccess: ExtendedProjectAccess[];
  }

  interface ExtendedProjectAccess extends Omit<ProjectAccess, "userId"> {
    project: Project;
  }

  type FileUploadResponse = Omit<FileUpload, "s3Path">;

  interface FullObservation extends Omit<Omit<Observation, 'userId'>, 'projectId'> {
    image: Omit<ImageUpload, 's3Path'> | null;
    fileUploads: Omit<FileUploadResponse, 'observationId'>[];
    user: { email: string } | null;
  }

  type FullDynamicProjectField = Omit<DynamicProjectField, "projectId">;

  interface DynamicFieldsResponse {
    dynamicFields: FullDynamicProjectField[];
  }

  interface ProjectFieldResponse extends Omit<ProjectField, "projectId"> {}

  interface FullProject extends Project {
    fields: ProjectFieldResponse[];
    dynamicFields: Omit<DynamicProjectField, "projectId">[];
    observations: Observation[];
    _count: {
      observations: number;
    }
  }

  interface FullImage extends Omit<ImageUpload, "s3Path"> {}

  type NewDynamicField = {
    label: string;
    field0Id: number;
    field1Id: number;
    operator: FieldOperator;
  };

  interface CMSInputProps {
    type: string;
    name: string;
    placeholder: string;
    step?: number;
  }

  interface CMSCheckboxProps {
    type: "checkbox";
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
    field: NewProjectField;
    props:
      | CMSInputProps
      | CMSCheckboxProps
      | CMSDropdownProps
      | CMSRadioGroupProps
      | CMSTextAreaProps;
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
    }[];
  }

  interface Breadcrumb {
    url: string;
    text: string;
  }

  type Square = [x: number, y: number, w: number, h: number];
  type SquareWithZoom = {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
  };

  type ImageChangeType = 'text' | 'line' | 'box';
  type ImageChange = {
    id: number;
    type: ImageChangeType;
    applied: boolean;
    component: TextBox | Box | Line;
  };
  type ImageChanges = ImageChange[];


  type ImageEditorComponent = SquareWithZoom & {
    id: number;
  };

  type Box = ImageEditorComponent & {
    fillColor: string;
  }

  type Line = ImageEditorComponent & {
    color: string;
    width: number;
  };

  type TextBox = {
    id: number;
    text: string;
    position: [number, number],
    zoom: number;
    size: number;
    color: string;
    bgcolor: string | undefined;
    padding: number;
  };

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
    };
  }

  type NewProjectFieldDraft = Omit<NewProjectField, 'type'> & {
    type: FieldType | undefined,
  }

  interface DropDownConfig {
    choices: string[];
  }

  type NewProjectBody = InferType<typeof NewProjectSchema>;
  type NewProjectField = InferType<typeof NewProjectFieldSchema>;
  type SignInBody = InferType<typeof SignInRequestSchema>;
  type SignUpBody = InferType<typeof SignUpRequestSchema>;
  type DynamicFieldsConfig = {
    [operator in FieldOperator]: {
      pairs: Array<[FieldType, FieldType]>;
    };
  };
  
  type Collaborator = {
    createdAt: Date;
    user: {
      id: number;
      email: string;
    };
  };

  interface ObservationFilterConfigs {
    [key: string]: ObservationFilterConfig;
  }

  interface ObservationFilterConfig {
    label: string;
    filter: (obs: FullObservation, user: Ref<CurrentUser>) => boolean;
  }
}
