import type {
  DynamicProjectField,
  ExportType as _ExportType,
  ExportStatus as _ExportStatus,
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
import { ExportProjectSchema } from '~/server/api/projects/[projectId]/exports/index.post';
import type {
  exportProjectQuery,
  bigUserQuery,
  observationColumns,
  allFieldColumns,
  allDynamicFieldColumns,
} from "~/server/utils/prisma";
import { Prisma } from '@prisma/client';

declare global {
  interface CurrentUser extends User {
    projectAccess: ExtendedProjectAccess[];
  }

  interface ExtendedProjectAccess extends Omit<ProjectAccess, "userId"> {
    project: Omit<Omit<FullProject, 'observations'>, 'authorId'>;
  }

  type FileUploadResponse = Omit<FileUpload, "s3Path">;

  interface FullObservation extends Omit<Omit<Observation, 'userId'>, 'projectId'> {
    image: Omit<ImageUpload, 's3Path'> | null;
    fileUploads: Omit<FileUploadResponse, 'observationId'>[];
    user: { email: string; id?: number } | null;
  }

  type FullDynamicProjectField = Omit<DynamicProjectField, "projectId">;

  type FullProjectExport = {
    id: number;
    createdAt: Date;
    projectId: number;
    mimetype: string;
    type: $Enums.ExportType;
    observationsCount: number;
    startDate: Date | null;
    endDate: Date | null;
    status: $Enums.ExportStatus;
    user: {
      id: number;
      email: string;
    } | null
  }

  interface DynamicFieldsResponse {
    dynamicFields: FullDynamicProjectField[];
  }

  interface ProjectExportsResponse {
    projectExports: {
      page: FullProjectExport[];
      generating: FullProjectExport[];
      total: number;
    },
    storageUsage: number;
    storageLimit: number;
  }

  type ExportMeta = {
    s3Path: string;
    mimetype: string;
    observationsCount: number;
    size: number;
  };

  type ExportFn = (
    event: H3Event,
    projectId: number,
    observationFilter: Prisma.ObservationWhereInput,
  ) => Promise<ExportMeta>;

  interface ProjectFieldResponse extends Omit<ProjectField, "projectId"> {}

  interface FullProject extends Project {
    authorCanDelockObservations: boolean;
    ownerCanDelockObservations: boolean;
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

  interface CMSTextAreaProps {
    name: string;
  }

  interface CMSMultipleChoiceProps {
    name: string;
    choices: string[];
  }

  interface CMSInput {
    field: NewProjectField;
    props:
      | CMSInputProps
      | CMSCheckboxProps
      | CMSMultipleChoiceProps
      | CMSTextAreaProps;
  }

  interface Window {
    electronAPI?: any;
  }

  interface TokenResponse {
    token: string;
  }

  interface IScrollshotSettingInput {
    label: string;
    help: string;
    type: 'number' | 'float';
    name: string;
    step?: number;
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
    minWidth: number;
    minHeight: number;
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
    role: string;
    nameInProject: string;
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
    filter: 'drafts' | 'published' | 'all';
    ownership: 'me' | 'everyone';
  }

  type ExportStatus = unknown & _ExportStatus;
  type ExportType = unknown & _ExportType;
  type ExportProjectParams = {
    startDate: Date;
    endDate: Date;
    exportType: ExportType;
  }

  type ExportedProject = Prisma.ProjectGetPayload<{ select: typeof exportProjectQuery }>;
  type AllFieldColumns = Prisma.ProjectFieldGetPayload<{ select: typeof allFieldColumns }>;
  type AllDynamicFieldColumns = Prisma.DynamicProjectFieldGetPayload<{ select: typeof allDynamicFieldColumns }>;
  type FullObservationPayload = Prisma.ObservationGetPayload<{ select: typeof observationColumns }>;
  type ExportProjectPayload = InferType<typeof ExportProjectSchema>;
}