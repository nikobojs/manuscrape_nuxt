<template>
  <div>
    <label v-if="observation.isDraft" class="block">
      <UInput class="hidden" type="file" :on:change="onFilePicked" />
      <div class="text-sm underline text-green-500 cursor-pointer">
        Upload file
      </div>
    </label>
    <UTable
      v-show="observation.fileUploads.length > 0"
      class="mt-6"
      :data="observation.fileUploads"
      :columns="fileUploadColumns"
    >
      <template #mimetype-cell="{ row }">
        <div class="w-5 h-5">
          <UIcon
            :name="getIconByMimetype(row.original.mimetype).icon"
            :class="`${getIconByMimetype(row.original.mimetype).class} text-xl`"
          />
        </div>
      </template>
      <template #originalName-cell="{ row }">
        <NuxtLink
          :href="`/api/projects/${project.id}/observations/${observation.id}/upload/${row.original.id}`"
          target="_blank"
          class="cursor-pointer hover:text-gray-200 transition-colors"
        >
          {{ row.original.originalName }}
        </NuxtLink>
      </template>
      <template #createdAt-cell="{ row }">
        {{ prettyDate(row.original.createdAt, true) }}
      </template>
      <template #delete-cell="{ row }">
        <div
          class="w-5 h-5 cursor-pointer transition-opacity opacity-80 hover:opacity-100"
          @click="handleDeleteFile(row.original)"
        >
          <UIcon name="i-mdi-trash-outline" :class="`text-red-600 text-xl`" />
        </div>
      </template>
    </UTable>
  </div>
</template>

<script lang="ts" setup>
import type { TableColumn } from "#ui/types";
const props = defineProps({
  onFileUploaded: requireFunctionProp<(file: File) => Promise<void>>(),
  onFileDeleted: requireFunctionProp<() => Promise<void>>(),
  observation: requireObservationProp,
  project: requireProjectProp,
});

const config = useRuntimeConfig().public;
const file = ref<File | undefined>();
const toast = useToast();
const { report } = useSentry();

const fileUploadColumns: TableColumn<any>[] = [
  {
    header: "",
    accessorKey: "mimetype",
    meta: { class: { td: "w-5" } },
  },
  {
    header: "File name",
    accessorKey: "originalName",
  },
  {
    header: "Date",
    accessorKey: "createdAt",
  },
  {
    header: "",
    accessorKey: "delete",
    meta: { class: { td: "w-5" } },
  },
];

async function onFilePicked(event: any) {
  const files = event?.target?.files || [];
  if (files.length == 0) {
    return;
  } else if (files.length > 1) {
    throw new Error("Only one file can be uploaded at a time");
  }

  // ensure size is ok
  if (files[0].size > config.maxFileSize) {
    toast.add({
      title: "File is too big",
      description: "Maximum size allowed is " + formatMb(config.maxFileSize),
      icon: "i-heroicons-exclamation-triangle",
      color: "error",
    });
    return;
  }

  file.value = files[0] as File;

  try {
    await uploadObservationFile(
      props.project.id,
      props.observation.id,
      file.value,
    )
      .then(async () => {
        if (typeof props.project?.id !== "number") {
          throw new Error("Project id is not found");
        }
        await props.onFileUploaded(file.value!);
      })
      .catch((e: any) => {
        let msg = "An error occured when uploading image";
        if (e.message) {
          msg = e.message;
        }
        toast.add({
          title: "File upload error",
          description: msg,
          icon: "i-heroicons-exclamation-triangle",
          color: "error",
        });
      });
  } catch (err) {
    console.error("File upload submit error:", err);
    throw err;
  }
}

async function handleDeleteFile(f: FileUploadResponse) {
  const confirmed = confirm("Are you sure you want to delete the file?");
  if (!confirmed) return;

  try {
    await deleteObservationFile(props.project.id, props.observation.id, f)
      .then(async () => {
        await props.onFileDeleted();
      })
      .catch(async (res: any) => {
        let msg = "An error occured when deleting file";
        if (res.json) {
          const json = await res.json();
          msg = getErrMsg(json);
        } else if (res instanceof Error) {
          msg = res.message;
        } else {
          console.error("Unhandled error:", res);
          report("error", res);
        }
        toast.add({
          title: "File upload error",
          description: msg,
          icon: "i-heroicons-exclamation-triangle",
          color: "error",
        });
      });
  } catch (err) {
    console.error("File upload submit error:", err);
    throw err;
  }
}
</script>
