import { useSessionStorage } from "@vueuse/core";
import { captureException } from "@sentry/vue";

const METADATA_DRAFT_STORE_NAME = "observation-draft-store";
const metadataDraft = useSessionStorage(METADATA_DRAFT_STORE_NAME, "{}", {
  mergeDefaults: false,
  onError(error) {
    console.error(error);
    captureException(error);
  },
});

export function useMetadataDraftStore() {
  function metadata() {
    const metadataJson = JSON.parse(metadataDraft.value);
    return metadataJson;
  }

  // update value
  function updateObservationMetadataDraft(obsId: number, data: any) {
    const metaJson = metadata();
    const existingObsJson = metaJson[obsId.toString()] || ({} as any);
    for (const k of Object.keys(data)) {
      if (data[k] === undefined) {
        data[k] = null;
      }
    }

    const newValueJson = {
      ...metaJson,
      [obsId.toString()]: { ...existingObsJson, ...data },
    };
    const newValue = JSON.stringify(newValueJson);
    metadataDraft.value = newValue;
  }

  // get value
  function getObservationMetadataDraft(obsId: number) {
    const draftStoreJson = metadata();
    let val: Record<string, any> | undefined = undefined;
    if (obsId.toString() in draftStoreJson) {
      val = draftStoreJson[obsId.toString()]!;
    }
    return val;
  }

  // remove value
  function removeObservationMetadataDraft(obsId: number): void {
    const val = getObservationMetadataDraft(obsId);
    if (!val) {
      console.warn("Will not remove non-existing metadata draft", {
        obsId,
        val,
      });
    }
    const draftStoreJson = metadata();
    if (obsId.toString() in draftStoreJson) {
      delete draftStoreJson?.[obsId + ""];
      metadataDraft.value = JSON.stringify(draftStoreJson);
    }
  }

  function observationHasModifiedDraft(
    observation: FullObservation,
    project: FullProject,
  ): boolean {
    const obsMeta = getObservationMetadataDraft(observation.id);
    if (!obsMeta) return false;
    const hasNoData =
      !observation.data || JSON.stringify(observation.data) === "{}";

    // generate empty observation from project.fields
    const emptyData = getEmptyObservationData(project);
    const compareObsData = hasNoData ? emptyData : observation.data || {};
    const objDiffers = objectDiffers(obsMeta, toRaw(compareObsData));
    return objDiffers;
  }

  function clearAllMetadataDrafts() {
    sessionStorage.setItem(METADATA_DRAFT_STORE_NAME, "{}");
    metadataDraft.value = "{}";
  }

  return {
    updateObservationMetadataDraft,
    getObservationMetadataDraft,
    removeObservationMetadataDraft,
    metadataDraft,
    observationHasModifiedDraft,
    clearAllMetadataDrafts,
  };
}
