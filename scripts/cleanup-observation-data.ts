/**
 * One-off cleanup: removes leftover observation `data` keys that don't
 * match any of the project's current field labels. These are remnants of
 * parameters deleted before the field-deletion cleanup was fixed.
 *
 * Usage:
 *   npx tsx scripts/cleanup-observation-data.ts           # dry-run (default)
 *   npx tsx scripts/cleanup-observation-data.ts --apply  # write changes
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "../server/utils/drizzle";
import {
  observations,
  projectAccesses,
  projects,
  users,
} from "../server/drizzle/schema";

type StaleUpdate = {
  observationId: number;
  projectId: number;
  staleKeys: string[];
  cleanedData: Record<string, any>;
};

/** Map of projectId -> set of current field labels */
async function getFieldLabelsByProject(): Promise<Map<number, Set<string>>> {
  const fields = await db.query.projectFields.findMany({
    columns: { projectId: true, label: true },
  });

  const labelsByProject = new Map<number, Set<string>>();
  for (const f of fields) {
    if (!labelsByProject.has(f.projectId)) {
      labelsByProject.set(f.projectId, new Set());
    }
    labelsByProject.get(f.projectId)!.add(f.label);
  }
  return labelsByProject;
}

/** Find all observations with data keys that don't match a current field label */
async function findStaleUpdates(
  labelsByProject: Map<number, Set<string>>,
): Promise<StaleUpdate[]> {
  return db.query.observations
    .findMany({
      columns: { id: true, projectId: true, data: true },
    })
    .then((allObservations) => {
      const updates: StaleUpdate[] = [];

      for (const obs of allObservations) {
        const labels = labelsByProject.get(obs.projectId);
        if (!labels || !obs.data || typeof obs.data !== "object") continue;

        const data = obs.data as Record<string, any>;
        const staleKeys = Object.keys(data).filter((k) => !labels.has(k));
        if (staleKeys.length === 0) continue;

        const cleanedData = { ...data };
        for (const k of staleKeys) delete cleanedData[k];

        updates.push({
          observationId: obs.id,
          projectId: obs.projectId,
          staleKeys,
          cleanedData,
        });
      }

      return updates;
    });
}

/** Print one line per affected observation */
function printObservationDetails(updates: StaleUpdate[]): void {
  for (const u of updates) {
    console.log(
      `obs #${u.observationId} (project ${u.projectId}): removing [${u.staleKeys.join(", ")}]`,
    );
  }
}

/** Print "ProjectName - N affected observations" per affected project */
async function printProjectSummary(updates: StaleUpdate[]): Promise<void> {
  const countsByProject = new Map<number, number>();
  for (const u of updates) {
    countsByProject.set(
      u.projectId,
      (countsByProject.get(u.projectId) ?? 0) + 1,
    );
  }

  const affectedProjects = await db.query.projects.findMany({
    columns: { id: true, name: true },
    where: inArray(projects.id, [...countsByProject.keys()]),
  });

  console.log("\nAffected projects:");
  for (const p of affectedProjects) {
    console.log(
      `${p.name} - ${countsByProject.get(p.id)} affected observations`,
    );
  }
}

/** Print emails of all users with access to any of the affected projects */
async function printAffectedUserEmails(updates: StaleUpdate[]): Promise<void> {
  const projectIds = [...new Set(updates.map((u) => u.projectId))];

  const accesses = await db.query.projectAccesses.findMany({
    columns: { userId: true },
    where: inArray(projectAccesses.projectId, projectIds),
  });

  const userIds = [...new Set(accesses.map((a) => a.userId))];
  if (userIds.length === 0) return;

  const affectedUsers = await db.query.users.findMany({
    columns: { id: true, email: true },
    where: inArray(users.id, userIds),
  });

  console.log("\nAffected users:");
  for (const u of affectedUsers) {
    console.log(u.email ?? `(user #${u.id} has no email)`);
  }
}

/** Write all cleaned observation data in a single transaction */
async function applyUpdates(updates: StaleUpdate[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (const u of updates) {
      await tx
        .update(observations)
        .set({ data: u.cleanedData })
        .where(eq(observations.id, u.observationId));
    }
  });
}

async function main() {
  const apply = process.argv.includes("--apply");

  const updates = await findStaleUpdates(await getFieldLabelsByProject());

  if (updates.length === 0) {
    console.log(
      "Nothing to clean — all observation data keys match current field labels.",
    );
    return;
  }

  printObservationDetails(updates);
  await printProjectSummary(updates);
  await printAffectedUserEmails(updates);

  const staleKeyCount = updates.reduce((sum, u) => sum + u.staleKeys.length, 0);

  if (!apply) {
    console.log(
      `\nDry-run: ${updates.length} observation(s) would be cleaned ` +
        `(${staleKeyCount} stale key(s)). Re-run with --apply to write changes.`,
    );
    return;
  }

  await applyUpdates(updates);
  console.log(
    `\nCleaned ${updates.length} observation(s), removed ${staleKeyCount} stale key(s).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
