// TODO: move more pure api functions out of composables and in here
//

export async function fetchObservationById(
  projectId: number | string | null,
  obsId: number | string | string[] | null,
): Promise<FullObservation | undefined> {
  obsId = requireNumber(obsId, "observationId");
  projectId = requireNumber(projectId, "observationId");
  const obs = await $fetch<FullObservation>(
    `/api/projects/${projectId}/observations/${obsId}`,
    {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return obs;
}

export async function upsertObservationImage(
  projectId: number,
  observationId: number,
  projectFieldId: number,
  file: File,
) {
  const form = new FormData();
  form.append("file", file);

  try {
    await $fetch(
      `/api/projects/${projectId}/observations/${observationId}/image-uploads`,
      {
        query: {
          projectFieldId,
        },
        method: "PUT",
        body: form,
        onRequest: (ctx) => {
          console.log("begin uploading image..");
        },
        onRequestError: (ctx) => {
          throw (
            ctx.error || new Error("Unknown client error when uploading image")
          );
        },
        onResponse: (ctx) => {
          console.log(
            "image uploaded successfully, status is",
            ctx.response.status,
          );
          if (window.electronAPI) {
            window.electronAPI.observationImageUploaded();
          }
        },
        onResponseError: (ctx) => {
          const statusCode = ctx.response?.status;
          if (statusCode === 413) {
            throw new Error("The uploaded observation image is too large");
          }
          const msg = getErrMsg(ctx.response?._data);
          throw new Error(msg || "It seems that the fileupload failed :(");
        },
      },
    );
  } catch (err: any) {
    console.error("upload image to observation err:", err);
    throw err;
  }
}
