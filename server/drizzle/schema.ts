import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export const fieldTypeEnum = pgEnum("field_type", [
  "DATE",
  "STRING",
  "INT",
  "FLOAT",
  "DATETIME",
  "BOOLEAN",
  "CHOICE",
  "MULTIPLE_CHOICE_ADD",
  "AUTOCOMPLETE",
  "AUTOCOMPLETE_ADD",
  "TEXTAREA",
]);

export const fieldOperatorEnum = pgEnum("field_operator", ["DIFF", "SUM"]);

export const projectRoleEnum = pgEnum("project_role", ["OWNER", "INVITED"]);

export const exportTypeEnum = pgEnum("export_type", [
  "NVIVO",
  "UPLOADS",
  "MEDIA",
]);

export const exportStatusEnum = pgEnum("export_status", [
  "QUEUED",
  "GENERATING",
  "DONE",
  "ERRORED",
]);

export const users = pgTable("User", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("Project", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  authorId: integer("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  authorCanDelockObservations: boolean("author_can_delock_observations")
    .default(false)
    .notNull(),
  ownerCanDelockObservations: boolean("owner_can_delock_observations")
    .default(false)
    .notNull(),
  contributorsCanReadAllObservations: boolean(
    "contributors_can_read_all_observations",
  )
    .default(false)
    .notNull(),
  contributorsCanExport: boolean("contributors_can_export")
    .default(false)
    .notNull(),
  storageLimit: integer("storage_limit")
    .default(1_000_000_000) // 1 GB default
    .notNull(),
});

export const projectAccesses = pgTable(
  "ProjectAccess",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    role: projectRoleEnum("role").default("OWNER").notNull(),
    nameInProject: varchar("name_in_project", { length: 255 }).notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "no action" }), // matches Prisma's `NoAction`
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);

export const projectFields = pgTable(
  "ProjectField",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: fieldTypeEnum("type").notNull(),
    choices: text("choices"), // nullable string
    required: boolean("required").default(false).notNull(),
    index: integer("index").notNull(),
  },
  (t) => [
    // Composite unique: (projectId, index)
    uniqueIndex("project_fields_project_id_index_unique").on(
      t.projectId,
      t.index,
    ),

    // Composite unique: (projectId, label)
    uniqueIndex("project_fields_project_id_label_unique").on(
      t.projectId,
      t.label,
    ),
  ],
);

export const projectFieldsRelations = relations(projectFields, ({ one }) => ({
  project: one(projects, {
    fields: [projectFields.projectId],
    references: [projects.id],
  }),
}));

export const dynamicProjectFields = pgTable(
  "DynamicProjectField",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    operator: fieldOperatorEnum("operator").notNull(),
    field0Id: integer("field0_id")
      .notNull()
      .references(() => projectFields.id, { onDelete: "no action" }),
    field1Id: integer("field1_id")
      .notNull()
      .references(() => projectFields.id, { onDelete: "no action" }),
  },
  (t) => [
    uniqueIndex("dynamic_pf_unique").on(t.field0Id, t.field1Id, t.operator),
  ],
);

export const projectInvitations = pgTable("ProjectInvitation", {
  id: serial("id").primaryKey(),
  inviterId: integer("inviter_id")
    .notNull()
    .references(() => users.id, { onDelete: "no action" }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  emailHash: varchar("email_hash", { length: 255 }).notNull(),
});

export const observations = pgTable("Observation", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "no action",
  }),
  data: jsonb("data")
    .default(sql`'{}'::jsonb`)
    .notNull(),
  uploadInProgress: boolean("upload_in_progress").default(false).notNull(),
  isDraft: boolean("is_draft").default(true).notNull(),
});

export const observationTags = pgTable(
  "ObservationTag",
  {
    observationId: integer("observation_id")
      .notNull()
      .references(() => observations.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "no action",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.observationId, t.tagId] })],
);

export const tags = pgTable(
  "Tag",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "no action",
    }),
  },
  (t) => [uniqueIndex("tags_project_id_name_unique").on(t.projectId, t.name)],
);

export const fileUploads = pgTable("FileUpload", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isS3: boolean("is_s3").default(false).notNull(),
  filePath: varchar("file_path", { length: 1024 }).unique().notNull(),
  mimetype: varchar("mimetype", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  observationId: integer("observation_id")
    .notNull()
    .references(() => observations.id, { onDelete: "cascade" }),
});

export const imageUploads = pgTable("ImageUpload", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isS3: boolean("is_s3").default(false).notNull(),
  filePath: varchar("file_path", { length: 1024 }).unique().notNull(),
  mimetype: varchar("mimetype", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  observationId: integer("observation_id")
    .unique()
    .notNull()
    .references(() => observations.id, { onDelete: "cascade" }),
});

export const projectExports = pgTable("ProjectExport", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  observationsCount: integer("observations_count").notNull(),
  isS3: boolean("is_s3").default(false).notNull(),
  filePath: varchar("file_path", { length: 1024 }).unique().notNull(),
  type: exportTypeEnum("type").notNull(),
  status: exportStatusEnum("status").notNull(),
  mimetype: varchar("mimetype", { length: 255 }).notNull(),
  error: text("error"), // nullable
  userId: integer("user_id")
    .references(() => users.id, {
      onDelete: "no action",
    })
    .notNull(),
  size: integer("size").notNull(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects, { relationName: "author" }),
  projectAccesses: many(projectAccesses),
  sentInvitations: many(projectInvitations, { relationName: "inviter" }),
  projectExports: many(projectExports),
  createdTags: many(tags, { relationName: "UserCreatedTags" }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  author: one(users, { fields: [projects.authorId], references: [users.id] }),
  fields: many(projectFields),
  dynamicFields: many(dynamicProjectFields),
  observations: many(observations),
  tags: many(tags),
  contributors: many(projectAccesses),
  invitations: many(projectInvitations),
  projectExports: many(projectExports),
}));

export const observationRelations = relations(observations, ({ one }) => ({
  user: one(users, { fields: [observations.userId], references: [users.id] }),
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema: {
    users,
    projects,
    projectAccesses,
    projectFields,
    dynamicProjectFields,
    projectInvitations,
    observations,
    observationTags,
    tags,
    fileUploads,
    imageUploads,
    projectExports,
    // plus any enum objects if you need them exported
  },
});
