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
      retry: 2,
      retryDelay: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return obs;
}

export async function uploadObservationFile(
  projectId: number,
  observationId: number,
  file: File,
) {
  const form = new FormData();
  form.append("file", file);

  try {
    await $fetch(
      `/api/projects/${projectId}/observations/${observationId}/upload`,
      {
        method: "POST",
        body: form,
        onRequest: (ctx) => {
          console.log("begin uploading file..");
        },
        onRequestError: (ctx) => {
          throw (
            ctx.error || new Error("Unknown client error when uploading file")
          );
        },
        onResponse: (ctx) => {
          console.log(
            "file uploaded successfully, status is",
            ctx.response.status,
          );
        },
        onResponseError: (ctx) => {
          const statusCode = ctx.response?.status;
          if (statusCode === 413) {
            throw new Error("The uploaded file is too large");
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

export async function upsertObservationImage(
  projectId: number,
  observationId: number,
  projectFieldId: number,
  file: File,
): Promise<{ imageUploadId: number; success: boolean }> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await $fetch<{ imageUploadId: number; success: boolean }>(
      `/api/projects/${projectId}/observations/${observationId}/image-uploads`,
      {
        query: {
          projectFieldId,
        },
        method: "PUT",
        body: form,
      },
    );
    if (window.electronAPI) {
      window.electronAPI.observationImageUploaded();
    }
    return res;
  } catch (err: any) {
    console.error("upload image to observation err:", err);
    const statusCode = err?.response?.status ?? err?.statusCode;
    if (statusCode === 413) {
      throw new Error("The uploaded observation image is too large");
    }
    throw new Error(getErrMsg(err?.data ?? err));
  }
}

export async function createObservation(projectId: number) {
  return $fetch(`/api/projects/${projectId}/observations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    console.error("create observation err:", err);
    throw err;
  });
}

export async function deleteObservationFile(
  projectId: number,
  observationId: number,
  file: FileUploadResponse,
) {
  return $fetch(
    `/api/projects/${projectId}/observations/${observationId}/upload/${file.id}`,
    {
      method: "DELETE",
    },
  ).catch((err) => {
    console.error("delete observation file err:", err);
    throw err;
  });
}

export async function patchObservation(
  projectId: number,
  obsId: number,
  data: any,
) {
  const res = await $fetch(`/api/projects/${projectId}/observations/${obsId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res;
}

export async function fetchAdjacentObservations(
  projectId: number,
  observationId: number,
): Promise<{ prevId: number | null; nextId: number | null }> {
  return $fetch<{ prevId: number | null; nextId: number | null }>(
    `/api/projects/${projectId}/observations/${observationId}/adjacent`,
    {
      credentials: "include",
      method: "GET",
      retry: 2,
      retryDelay: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

export async function deleteObservation(projectId: number, obsId: number) {
  const res = await $fetch(`/api/projects/${projectId}/observations/${obsId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res;
}

export function postPasswordReset(token: string, password: string) {
  const tokenEncoded = encodeURIComponent(token.trim());
  return $fetch("/api/reset-password/reset", {
    method: "POST",
    body: { token: tokenEncoded, password },
  });
}

export function requestForgotPasswordEmail(email: string) {
  return $fetch("/api/reset-password/request", {
    method: "POST",
    body: { email },
  });
}

export function updateProfile(name: string, email: string | null) {
  return $fetch("/api/user", {
    method: "PUT",
    body: { name, email },
  });
}
