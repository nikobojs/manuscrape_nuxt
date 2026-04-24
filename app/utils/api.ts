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
): Promise<{ imageUploadId: number; success: boolean }> {
  const form = new FormData();
  form.append("file", file);
  return new Promise(async (resolve, reject) => {
    try {
      await $fetch(
        `/api/projects/${projectId}/observations/${observationId}/image-uploads`,
        {
          query: {
            projectFieldId,
          },
          method: "PUT",
          body: form,
          onRequestError: (ctx) => {
            reject(
              ctx.error ||
                new Error("Unknown client error when uploading image"),
            );
          },
          onResponse: async (ctx) => {
            console.log(
              "image uploaded successfully, status is",
              ctx.response.status,
            );
            if (window.electronAPI) {
              window.electronAPI.observationImageUploaded();
            }
            resolve(
              ctx.response._data as {
                imageUploadId: number;
                success: boolean;
              },
            );
          },
          onResponseError: (ctx) => {
            const statusCode = ctx.response?.status;
            if (statusCode === 413) {
              reject(new Error("The uploaded observation image is too large"));
            }
            const msg = getErrMsg(ctx.response?._data);
            reject(new Error(msg || "It seems that the fileupload failed :("));
          },
        },
      );
    } catch (err: any) {
      console.error("upload image to observation err:", err);
      throw reject(err);
    }
  });
}
