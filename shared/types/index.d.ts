import {
  dynamicProjectFields,
  exportStatusEnum,
  exportTypeEnum,
  fieldOperatorEnum,
  fieldTypeEnum,
  projectRoleEnum,
  observations,
} from "~~/server/drizzle/schema";
import type { H3Event } from "h3";
import {
  NewProjectFieldSchema,
  NewProjectSchema,
} from "~~/server/api/projects.post";
import type { InferType } from "yup";
import { SignInRequestSchema } from "~~/server/api/auth.post";
import { SignUpRequestSchema } from "~~/server/api/user.post";
import type {
  exportProjectQuery,
  bigUserQuery,
  observationColumns,
  allFieldColumns,
  allDynamicFieldColumns,
} from "~~/server/utils/prisma";
import { ExportProjectSchema } from "~~/shared/schemas/ExportProject";
import { projectFields } from "~~/server/drizzle/schema";

export interface CurrentUser extends Omit<User, "tags"> {
  authSource: AuthSource;
  projectAccess: ExtendedProjectAccess[];
}

export interface ExtendedProjectAccess extends Omit<ProjectAccess, "userId"> {
  project: SmallProject;
}

export type FileUploadResponse = Omit<Omit<FileUpload, "filePath">, "isS3">;

export interface FullObservation {
  id: number;
  images: ImageUpload[];
  fileUploads: Omit<FileUploadResponse, "observationId">[];
  user: {
    email: string | null;
    name: string | null;
    samlOrganizationName: string | null;
    id: number;
  } | null;
  data: Record<string, any> | null;
  tags: { name: string; id: number }[];
  uploadInProgress: boolean;
  isDraft: boolean;
  userId: number | null;
  projectId: number;
  updatedAt: Date | string;
  createdAt: Date | string;
}

export type ImageUpload = {
  id: number;
  createdAt: Date;
  observationId: number;
  projectFieldId: number;
  mimetype: string;
  originalName: string;
};

export type User = {
  id: number;
  email: string | null;
  name: string;
  samlOrganizationName: string | null;
  createdAt: Date | string;
};

export type FullDynamicProjectField = Omit<DynamicProjectField, "projectId">;

export type FullProjectExport = {
  id: number;
  createdAt: Date;
  projectId: number;
  mimetype: string;
  type: ExportType;
  observationsCount: number;
  startDate: Date | null;
  endDate: Date | null;
  status: ExportStatus;
  userId: number;
  user: {
    id: number;
    email: string | null;
    name: string | null;
  } | null;
};

export interface DynamicFieldsResponse {
  dynamicFields: FullDynamicProjectField[];
}

export interface ProjectExportsResponse {
  projectExports: {
    page: FullProjectExport[];
    generating: FullProjectExport[];
    total: number;
  };
  storageUsage: number;
  storageLimit: number;
}

export type ExportMeta = {
  filePath: string;
  isS3: boolean;
  mimetype: string;
  observationsCount: number;
  size: number;
};

export interface ProjectFieldResponse extends Omit<
  SmallProjectField,
  "projectId"
> {}

export interface FullProject extends Project {
  id: number;
  name: string;
  createdAt: string | Date;
  authorCanDelockObservations: boolean;
  ownerCanDelockObservations: boolean;
  contributorsCanReadAllObservations: boolean;
  contributorsCanExport: boolean;
  fields: SmallProjectField[];
  dynamicFields: Omit<DynamicProjectField, "projectId">[];
  observations: Observation[];
  tags: Tag[];
  observationCount: number;
}

export interface FullImage extends Omit<
  Omit<Omit<ImageUpload, "filePath">, "isS3">,
  "observationId"
> {}

export type NewDynamicField = {
  label: string;
  field0Id: number;
  field1Id: number;
  operator: FieldOperator;
};

export interface CMSInputProps {
  type: string;
  name: string;
  placeholder: string;
  step?: number;
}

export interface CMSCheckboxProps {
  type: "checkbox";
  name: string;
  label: string;
  checked: boolean;
}

export interface CMSTextAreaProps {
  name: string;
}

export interface CMSMultipleChoiceProps {
  name: string;
  choices: string[];
}

export interface CMSImageProps {
  label: string;
}

export interface CMSImagesProps {
  label: string;
}

export interface CMSInput {
  field: NewProjectField & { id: number };
  props:
    | CMSInputProps
    | CMSCheckboxProps
    | CMSMultipleChoiceProps
    | CMSTextAreaProps
    | CMSImageProps
    | CMSImagesProps;
}

declare global {
  interface Window {
    electronAPI?: any;
  }
}

export interface IScrollshotSettingInput {
  label: string;
  help: string;
  type: "number" | "float";
  name: string;
  step?: number;
}

export interface Breadcrumb {
  url: string;
  text: string;
}

export type Square = [x: number, y: number, w: number, h: number];
export type SquareWithZoom = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
};

export type ImageChangeType = "text" | "line" | "box";
export type ImageChange = {
  id: number;
  type: ImageChangeType;
  applied: boolean;
  component: TextBox | Box | Line;
};
export type ImageChanges = ImageChange[];

export type ImageEditorComponent = SquareWithZoom & {
  id: number;
};

export type Box = ImageEditorComponent & {
  fillColor: string;
};

export type Line = ImageEditorComponent & {
  color: string;
  width: number;
};

export type TextBox = {
  id: number;
  text: string;
  position: [number, number];
  zoom: number;
  size: number;
  color: string;
  bgcolor: string | undefined;
  minWidth: number;
  minHeight: number;
};

export interface QueryParamOptions<T> {
  name: string;
  event: H3Event;
  defaultValue?: T;
  parse: (value: string) => T;
  validate: (parsed: T) => boolean;
  required?: boolean;
}

export enum AuthSource {
  PASSWORD = "PASSWORD",
  SAML = "SAML",
}

// export interface IProjectAccess {
//   role: string;
//   project: {
//     id: number;
//   };
// }

export type NewProjectFieldDraft = Omit<
  Omit<NewProjectField, "type">,
  "index"
> & {
  type: FieldType | undefined;
};

export interface DropDownConfig {
  choices: string[];
}

export type NewProjectBody = InferType<typeof NewProjectSchema>;
export type NewProjectField = InferType<typeof NewProjectFieldSchema>;
export type SignInBody = InferType<typeof SignInRequestSchema>;
export type SignUpBody = InferType<typeof SignUpRequestSchema>;
export type DynamicFieldsConfigT = {
  [operator in FieldOperator]: {
    pairs: Array<[FieldType, FieldType]>;
  };
};

export type Collaborator = {
  createdAt: Date | string;
  role: string;
  nameInProject: string;
  user_id: number;
  project_id: number;
  user_email: string | null;
  user_name: string | null;
};

export type Tag = {
  id: number;
  name: string;
  projectId: number;
  createdById: number | null;
  project: { id: number; name: string }; // pick relevant project fields
  observations: Array<{ id: number; data: string }>; // pick relevant observation fields
  createdBy: { id: number; email: string } | null;
};

export interface ObservationFilterConfigs {
  [key: string]: ObservationFilterConfig;
}

export interface ObservationFilterConfig {
  label: string;
  filter: "drafts" | "published" | "all";
  ownership: "me" | "everyone";
}

export type ExportType = (typeof exportTypeEnum.enumValues)[number];
export type ExportStatus = (typeof exportStatusEnum.enumValues)[number];
export type FieldOperator = (typeof fieldOperatorEnum.enumValues)[number];
export type ProjectRole = (typeof projectRoleEnum.enumValues)[number];
export type FieldType = (typeof fieldTypeEnum.enumValues)[number];
export type ExportProjectParams = {
  startDate: Date;
  endDate: Date;
  exportType: ExportType;
  includeTags: Boolean;
};

export type ExportProjectPayload = InferType<typeof ExportProjectSchema>;

export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type FullObservation = Pick<
  typeof observations.$inferSelect,
  | "id"
  | "createdAt"
  | "data"
  | "isDraft"
  | "projectId"
  | "updatedAt"
  | "uploadInProgress"
  | "userId"
>;

export type SmallProjectField = Pick<
  typeof projectFields.$inferSelect,
  | "choices"
  | "createdAt"
  | "id"
  | "index"
  | "label"
  | "projectId"
  | "required"
  | "type"
>;

export type FullDynamicProjectField = Pick<
  typeof dynamicProjectFields.$inferSelect,
  | "id"
  | "field0Id"
  | "field1Id"
  | "createdAt"
  | "operator"
  | "label"
  | "projectId"
>;

export type SmallProject = Omit<FullProject, "observations" | "tags"> & {
  tags: { id: number; name: string }[];
};

export type GetObservationsResponse = {
  observations: FullObservation[];
  total: number;
  totalDraft: number;
};

export interface TokenUserData {
  id: number;
  email: string | null;
  name: string;
  authSource?: string;
}

export type SAMLSessionData = {
  saml: { nameID: string; sessionIndex: string; inResponseTo: string };
};
