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
import { AuthSource } from "./auth-source";

declare global {
  interface CurrentUser extends Omit<User, "tags"> {
    authSource: AuthSource;
    projectAccess: ExtendedProjectAccess[];
  }

  interface ExtendedProjectAccess extends Omit<ProjectAccess, "userId"> {
    project: SmallProject;
  }

  type FileUploadResponse = Omit<Omit<FileUpload, "filePath">, "isS3">;

  interface FullObservation {
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

  type ImageUpload = {
    id: number;
    createdAt: Date;
    observationId: number;
    projectFieldId: number;
    mimetype: string;
    originalName: string;
  };

  type User = {
    id: number;
    email: string | null;
    name: string;
    samlOrganizationName: string | null;
    createdAt: Date | string;
  };

  type FullDynamicProjectField = Omit<DynamicProjectField, "projectId">;

  type FullProjectExport = {
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

  interface DynamicFieldsResponse {
    dynamicFields: FullDynamicProjectField[];
  }

  interface ProjectExportsResponse {
    projectExports: {
      page: FullProjectExport[];
      generating: FullProjectExport[];
      total: number;
    };
    storageUsage: number;
    storageLimit: number;
  }

  type ExportMeta = {
    filePath: string;
    isS3: boolean;
    mimetype: string;
    observationsCount: number;
    size: number;
  };

  interface ProjectFieldResponse extends Omit<SmallProjectField, "projectId"> {}

  interface FullProject extends Project {
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

  interface FullImage extends Omit<
    Omit<Omit<ImageUpload, "filePath">, "isS3">,
    "observationId"
  > {}

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

  interface CMSImageProps {
    label: string;
  }

  interface CMSImagesProps {
    label: string;
  }

  interface CMSInput {
    field: NewProjectField & { id: number };
    props:
      | CMSInputProps
      | CMSCheckboxProps
      | CMSMultipleChoiceProps
      | CMSTextAreaProps
      | CMSImageProps
      | CMSImagesProps;
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
    type: "number" | "float";
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

  type ImageChangeType = "text" | "line" | "box";
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
  };

  type Line = ImageEditorComponent & {
    color: string;
    width: number;
  };

  type TextBox = {
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

  interface QueryParamOptions<T> {
    name: string;
    event: H3Event;
    defaultValue?: T;
    parse: (value: string) => T;
    validate: (parsed: T) => boolean;
    required?: boolean;
  }

  // interface IProjectAccess {
  //   role: string;
  //   project: {
  //     id: number;
  //   };
  // }

  type NewProjectFieldDraft = Omit<Omit<NewProjectField, "type">, "index"> & {
    type: FieldType | undefined;
  };

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
    createdAt: Date | string;
    role: string;
    nameInProject: string;
    user_id: number;
    project_id: number;
    user_email: string | null;
    user_name: string | null;
  };

  type Tag = {
    id: number;
    name: string;
    projectId: number;
    createdById: number | null;
    project: { id: number; name: string }; // pick relevant project fields
    observations: Array<{ id: number; data: string }>; // pick relevant observation fields
    createdBy: { id: number; email: string } | null;
  };

  interface ObservationFilterConfigs {
    [key: string]: ObservationFilterConfig;
  }

  interface ObservationFilterConfig {
    label: string;
    filter: "drafts" | "published" | "all";
    ownership: "me" | "everyone";
  }

  type ExportType = (typeof exportTypeEnum.enumValues)[number];
  type ExportStatus = (typeof exportStatusEnum.enumValues)[number];
  type FieldOperator = (typeof fieldOperatorEnum.enumValues)[number];
  type ProjectRole = (typeof projectRoleEnum.enumValues)[number];
  type FieldType = (typeof fieldTypeEnum.enumValues)[number];
  type ExportProjectParams = {
    startDate: Date;
    endDate: Date;
    exportType: ExportType;
    includeTags: Boolean;
  };

  type ExportProjectPayload = InferType<typeof ExportProjectSchema>;

  type Transaction = PgTransaction<
    PostgresJsQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
  >;

  type FullObservation = Pick<
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

  type SmallProjectField = Pick<
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

  type FullDynamicProjectField = Pick<
    typeof dynamicProjectFields.$inferSelect,
    | "id"
    | "field0Id"
    | "field1Id"
    | "createdAt"
    | "operator"
    | "label"
    | "projectId"
  >;

  type SmallProject = Omit<FullProject, "observations" | "tags"> & {
    tags: { id: number; name: string }[];
  };

  type GetObservationsResponse = {
    observations: FullObservation[];
    total: number;
    totalDraft: number;
  };
}
