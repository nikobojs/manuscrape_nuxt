import { and, eq, inArray } from "drizzle-orm";
import * as yup from "yup";
import { observations, observationTags } from "~~/server/drizzle/schema";
import {
  findObservationTagsInArray,
  getObservationById,
  setObservationDraft,
} from "~~/server/utils/observations";
import { getProjectById } from "~~/server/utils/project";
import { getProjectAccess } from "~~/server/utils/projectAccess";

const patchObservationSchema = yup
  .object({
    isDraft: yup.bool().optional(),
    data: yup.object().optional(),
    tags: yup
      .object()
      .shape({
        connect: yup
          .array()
          .of(yup.object({ id: yup.number().required() }))
          .optional(),
        disconnect: yup
          .array()
          .of(yup.object({ id: yup.number().required() }))
          .optional(),
      })
      .optional(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  const params = event.context.params;
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);
  await ensureURLResourceAccess(event, event.context.user);

  const body = await readBody(event);
  let patch = await patchObservationSchema.validate(body);
  patch = removeKeysByUndefinedValue(patch);

  // fetch existing observation
  const project = await getProjectById(projectId, {
    id: true,
    authorCanDelockObservations: true,
    ownerCanDelockObservations: true,
  });

  // if it does not exist, then throw up
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project was not found",
    });
  }

  // fetch existing observation
  const observation = await getObservationById(observationId, {
    id: true,
    isDraft: true,
    projectId: true,
    userId: true,
  });

  // if it does not exist, then throw up
  if (!observation || observation.projectId !== projectId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation was not found",
    });
  }

  // find user role
  const access = await getProjectAccess(user.id, project.id);
  const role = access?.role;
  if (typeof role !== "string") {
    // report invalid role
    console.error(`Project access role '${role}' is not valid`);
    return false;
  }

  // find out if user is author of observation
  const isAuthor = observation.userId === user.id;
  const isProjectOwner = role === "OWNER";

  // if patch includes isDraft
  if (Object.keys(patch).includes("isDraft")) {
    // if unpublishing while observation is already unpublished
    if (patch.isDraft && observation.isDraft) {
      throw createError({
        statusCode: 403,
        statusMessage: "Observation is already delocked",
      });

      // if trying to publish, while isDraft is already false / already published
    } else if (!patch.isDraft && !observation.isDraft) {
      throw createError({
        statusCode: 403,
        statusMessage: "Observation is already published",
      });
      // if trying to delock
    } else if (patch.isDraft && !observation.isDraft) {
      // if not either (isAuther && isAuthorRule) and (isOwner && isOwnerRule),
      // don't allow unpublishing
      if (
        !(isAuthor && project.authorCanDelockObservations) &&
        !(isProjectOwner && project.ownerCanDelockObservations)
      ) {
        throw createError({
          statusCode: 403,
          statusMessage: "You are not allowed to delock observation",
        });
      }
      // if trying to publish the observation, only allow author and project owner
    } else if (!patch.isDraft && observation.isDraft) {
      if (!isAuthor && !isProjectOwner) {
        throw createError({
          statusCode: 403,
          statusMessage: "You are not allowed to publish this observation",
        });
      }
    }
  }

  // retrieve tag ids from patch
  const tagsToConnect: number[] = patch.tags?.connect?.map((t) => t.id) || [];
  const tagsToDisconnect: number[] =
    patch.tags?.disconnect?.map((t) => t.id) || [];

  // validate new tags
  if (tagsToConnect.length > 0) {
    const validTagIds = await findObservationTagsInArray(
      tagsToConnect,
      projectId,
    );
    const validTagIdSet = new Set(validTagIds);
    for (const tagId of tagsToConnect) {
      if (!validTagIdSet.has(tagId)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Tag ${tagId} does not belong to project ${projectId}`,
        });
      }
    }
  }

  db.transaction(async (tx) => {
    // delete tags
    if (tagsToDisconnect.length > 0) {
      await tx
        .delete(observationTags)
        .where(
          and(
            eq(observationTags.observationId, observationId),
            inArray(observationTags.tagId, tagsToDisconnect),
          ),
        );
    }

    // add new tags
    if (tagsToConnect.length > 0) {
      const newTags = tagsToConnect.map((id) => {
        return {
          tagId: id,
          observationId: observationId,
          createdAt: new Date(),
          createdById: user.id,
        } satisfies Awaited<typeof observationTags.$inferSelect>;
      });

      await tx.insert(observationTags).values(newTags);
    }

    // update `data`
    if (patch.data) {
      await tx
        .update(observations)
        .set({
          data: patch.data,
        })
        .where(eq(observations.id, observationId));
    }

    // update `isDraft`
    if (typeof patch.isDraft === "boolean") {
      await setObservationDraft(tx, observationId, patch.isDraft);
    }

    // always update `updatedAt`
    await tx
      .update(observations)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(observations.id, observationId));
  });

  return {
    id: observationId,
    msg: "observation draft patched!",
  };
});

// TODO: move to util
function removeKeysByUndefinedValue(
  obj: Record<string, any>,
): Record<string, any> {
  const result = {} as Record<string, any>;
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}
