import {
  pgTable,
  foreignKey,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  varchar,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const exportStatus = pgEnum("ExportStatus", [
  "QUEUED",
  "GENERATING",
  "DONE",
  "ERRORED",
]);
export const exportType = pgEnum("ExportType", ["NVIVO", "UPLOADS", "MEDIA"]);
export const fieldOperator = pgEnum("FieldOperator", ["DIFF", "SUM"]);
export const fieldType = pgEnum("FieldType", [
  "DATE",
  "STRING",
  "INT",
  "FLOAT",
  "DATETIME",
  "BOOLEAN",
  "CHOICE",
  "AUTOCOMPLETE",
  "AUTOCOMPLETE_ADD",
  "TEXTAREA",
  "MULTIPLE_CHOICE_ADD",
]);
export const projectRole = pgEnum("ProjectRole", ["OWNER", "INVITED"]);

/**
 * NOTE: this schema should never change, as it acts as the base schema
 * on which migrations are applied to
 */

export const project = pgTable(
  "Project",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    authorId: integer(),
    authorCanDelockObservations: boolean().default(false).notNull(),
    ownerCanDelockObservations: boolean().default(false).notNull(),
    storageLimit: integer().default(1000000000).notNull(),
    contributorsCanReadAllObservations: boolean().default(false).notNull(),
    contributorsCanExport: boolean().default(false).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [user.id],
      name: "Project_authorId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const imageUpload = pgTable(
  "ImageUpload",
  {
    id: serial().primaryKey().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    filePath: text().notNull(),
    mimetype: text().notNull(),
    originalName: text().notNull(),
    isS3: boolean().notNull(),
    observationId: integer().notNull(),
  },
  (table) => [
    uniqueIndex("ImageUpload_filePath_key").using(
      "btree",
      table.filePath.asc().nullsLast().op("text_ops"),
    ),
    uniqueIndex("ImageUpload_observationId_key").using(
      "btree",
      table.observationId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.observationId],
      foreignColumns: [observation.id],
      name: "ImageUpload_observationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const tag = pgTable(
  "Tag",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    projectId: integer().notNull(),
    createdById: integer(),
  },
  (table) => [
    uniqueIndex("Tag_projectId_name_key").using(
      "btree",
      table.projectId.asc().nullsLast().op("int4_ops"),
      table.name.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [user.id],
      name: "Tag_createdById_fkey",
    }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [project.id],
      name: "Tag_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const observation = pgTable(
  "Observation",
  {
    id: serial().primaryKey().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    data: text().default("{}").notNull(),
    projectId: integer().notNull(),
    userId: integer(),
    isDraft: boolean().default(true).notNull(),
    updatedAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    uploadInProgress: boolean().default(false).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [project.id],
      name: "Observation_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Observation_userId_fkey",
    }),
  ],
);

export const projectExport = pgTable(
  "ProjectExport",
  {
    id: serial().primaryKey().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    startDate: timestamp({ precision: 3, mode: "string" }).notNull(),
    endDate: timestamp({ precision: 3, mode: "string" }).notNull(),
    observationsCount: integer().notNull(),
    filePath: text().notNull(),
    type: exportType().notNull(),
    status: exportStatus().notNull(),
    mimetype: text().notNull(),
    size: integer().notNull(),
    error: text(),
    userId: integer(),
    projectId: integer().notNull(),
    isS3: boolean().notNull(),
  },
  (table) => [
    uniqueIndex("ProjectExport_filePath_key").using(
      "btree",
      table.filePath.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [project.id],
      name: "ProjectExport_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "ProjectExport_userId_fkey",
    }),
  ],
);

export const projectInvitation = pgTable(
  "ProjectInvitation",
  {
    id: serial().primaryKey().notNull(),
    inviterId: integer().notNull(),
    projectId: integer().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    emailHash: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: "ProjectInvitation_inviterId_fkey",
    }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [project.id],
      name: "ProjectInvitation_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const fileUpload = pgTable(
  "FileUpload",
  {
    id: serial().primaryKey().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    filePath: text().notNull(),
    mimetype: text().notNull(),
    originalName: text().notNull(),
    observationId: integer().notNull(),
    isS3: boolean().notNull(),
  },
  (table) => [
    uniqueIndex("FileUpload_filePath_key").using(
      "btree",
      table.filePath.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.observationId],
      foreignColumns: [observation.id],
      name: "FileUpload_observationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const projectField = pgTable(
  "ProjectField",
  {
    id: serial().primaryKey().notNull(),
    label: text().notNull(),
    projectId: integer().notNull(),
    type: fieldType().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    required: boolean().default(false).notNull(),
    choices: text(),
    index: integer().notNull(),
  },
  (table) => [
    uniqueIndex("ProjectField_projectId_index_key").using(
      "btree",
      table.projectId.asc().nullsLast().op("int4_ops"),
      table.index.asc().nullsLast().op("int4_ops"),
    ),
    uniqueIndex("ProjectField_projectId_label_key").using(
      "btree",
      table.projectId.asc().nullsLast().op("int4_ops"),
      table.label.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [project.id],
      name: "ProjectField_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const prismaMigrations = pgTable("_prisma_migrations", {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "string" }),
  migrationName: varchar("migration_name", { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: timestamp("rolled_back_at", {
    withTimezone: true,
    mode: "string",
  }),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const dynamicProjectField = pgTable(
  "DynamicProjectField",
  {
    id: serial().primaryKey().notNull(),
    label: text().notNull(),
    projectId: integer().notNull(),
    operator: fieldOperator().notNull(),
    field0Id: integer().notNull(),
    field1Id: integer().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("DynamicProjectField_field0Id_field1Id_operator_key").using(
      "btree",
      table.field0Id.asc().nullsLast().op("enum_ops"),
      table.field1Id.asc().nullsLast().op("int4_ops"),
      table.operator.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.field0Id],
      foreignColumns: [projectField.id],
      name: "DynamicProjectField_field0Id_fkey",
    }),
    foreignKey({
      columns: [table.field1Id],
      foreignColumns: [projectField.id],
      name: "DynamicProjectField_field1Id_fkey",
    }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [project.id],
      name: "DynamicProjectField_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const user = pgTable(
  "User",
  {
    id: serial().primaryKey().notNull(),
    email: text().notNull(),
    password: text().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("User_email_key").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const observationTag = pgTable(
  "ObservationTag",
  {
    observationId: integer().notNull(),
    tagId: integer().notNull(),
    createdById: integer(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.observationId],
      foreignColumns: [observation.id],
      name: "ObservationTag_observationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tag.id],
      name: "ObservationTag_tagId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    primaryKey({
      columns: [table.observationId, table.tagId],
      name: "ObservationTag_pkey",
    }),
  ],
);

export const projectAccess = pgTable(
  "ProjectAccess",
  {
    role: projectRole().default("OWNER").notNull(),
    userId: integer().notNull(),
    projectId: integer().notNull(),
    createdAt: timestamp({ precision: 6, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    nameInProject: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [project.id],
      name: "ProjectAccess_projectId_fkey",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "ProjectAccess_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    primaryKey({
      columns: [table.userId, table.projectId],
      name: "ProjectAccess_pkey",
    }),
  ],
);
