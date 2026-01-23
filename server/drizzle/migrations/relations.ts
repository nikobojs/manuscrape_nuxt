import { relations } from "drizzle-orm/relations";
import {
  user,
  project,
  observation,
  imageUpload,
  tag,
  projectExport,
  projectInvitation,
  fileUpload,
  projectField,
  dynamicProjectField,
  observationTag,
  projectAccess,
} from "./pulled_schema";

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.authorId],
    references: [user.id],
  }),
  tags: many(tag),
  observations: many(observation),
  projectExports: many(projectExport),
  projectInvitations: many(projectInvitation),
  projectFields: many(projectField),
  dynamicProjectFields: many(dynamicProjectField),
  projectAccesses: many(projectAccess),
}));

export const userRelations = relations(user, ({ many }) => ({
  projects: many(project),
  tags: many(tag),
  observations: many(observation),
  projectExports: many(projectExport),
  projectInvitations: many(projectInvitation),
  projectAccesses: many(projectAccess),
}));

export const imageUploadRelations = relations(imageUpload, ({ one }) => ({
  observation: one(observation, {
    fields: [imageUpload.observationId],
    references: [observation.id],
  }),
}));

export const observationRelations = relations(observation, ({ one, many }) => ({
  imageUploads: many(imageUpload),
  project: one(project, {
    fields: [observation.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [observation.userId],
    references: [user.id],
  }),
  fileUploads: many(fileUpload),
  observationTags: many(observationTag),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  user: one(user, {
    fields: [tag.createdById],
    references: [user.id],
  }),
  project: one(project, {
    fields: [tag.projectId],
    references: [project.id],
  }),
  observationTags: many(observationTag),
}));

export const projectExportRelations = relations(projectExport, ({ one }) => ({
  project: one(project, {
    fields: [projectExport.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectExport.userId],
    references: [user.id],
  }),
}));

export const projectInvitationRelations = relations(
  projectInvitation,
  ({ one }) => ({
    user: one(user, {
      fields: [projectInvitation.inviterId],
      references: [user.id],
    }),
    project: one(project, {
      fields: [projectInvitation.projectId],
      references: [project.id],
    }),
  }),
);

export const fileUploadRelations = relations(fileUpload, ({ one }) => ({
  observation: one(observation, {
    fields: [fileUpload.observationId],
    references: [observation.id],
  }),
}));

export const projectFieldRelations = relations(
  projectField,
  ({ one, many }) => ({
    project: one(project, {
      fields: [projectField.projectId],
      references: [project.id],
    }),
    dynamicProjectFields_field0Id: many(dynamicProjectField, {
      relationName: "dynamicProjectField_field0Id_projectField_id",
    }),
    dynamicProjectFields_field1Id: many(dynamicProjectField, {
      relationName: "dynamicProjectField_field1Id_projectField_id",
    }),
  }),
);

export const dynamicProjectFieldRelations = relations(
  dynamicProjectField,
  ({ one }) => ({
    projectField_field0Id: one(projectField, {
      fields: [dynamicProjectField.field0Id],
      references: [projectField.id],
      relationName: "dynamicProjectField_field0Id_projectField_id",
    }),
    projectField_field1Id: one(projectField, {
      fields: [dynamicProjectField.field1Id],
      references: [projectField.id],
      relationName: "dynamicProjectField_field1Id_projectField_id",
    }),
    project: one(project, {
      fields: [dynamicProjectField.projectId],
      references: [project.id],
    }),
  }),
);

export const observationTagRelations = relations(observationTag, ({ one }) => ({
  observation: one(observation, {
    fields: [observationTag.observationId],
    references: [observation.id],
  }),
  tag: one(tag, {
    fields: [observationTag.tagId],
    references: [tag.id],
  }),
}));

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(project, {
    fields: [projectAccess.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectAccess.userId],
    references: [user.id],
  }),
}));
