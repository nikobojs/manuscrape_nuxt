<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center h-4">
        <CardHeader>Export</CardHeader>
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <div>
        <NuxtLink @click.prevent="tryDownload('nvivo')">
          <UButton
            :disabled="downloading.includes('nvivo')"
            :loading="downloading.includes('nvivo')"
            icon="i-mdi-microsoft-excel"
            variant="outline"
            color="blue"
            >Export spreadsheet</UButton
          >
        </NuxtLink>
      </div>
      <div>
        <NuxtLink @click.prevent="tryDownload('media')">
          <UButton
            :disabled="downloading.includes('media')"
            :loading="downloading.includes('media')"
            icon="i-mdi-image-multiple-outline"
            variant="outline"
            color="blue"
            >Export images</UButton
          >
        </NuxtLink>
      </div>
      <div>
        <NuxtLink @click.prevent="tryDownload('uploads')">
          <UButton
            :disabled="downloading.includes('uploads')"
            :loading="downloading.includes('uploads')"
            icon="i-mdi-arrow-collapse-down"
            variant="outline"
            color="blue"
            >Export uploads</UButton
          >
        </NuxtLink>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps({
  project: requireProjectProp,
});

const toast = useToast();
const downloading = reactive<string[]>([]);
const doneDownloading = (t: string) => {
  var index = downloading.indexOf(t);
  if (index !== -1) {
    downloading.splice(index, 1);
  }
};

async function tryDownload(t: string) {
  const url = `/api/projects/${props.project.id}/export?type=${t}`;
  downloading.push(t);
  fetch(url).then(async (res) => {
    // if res is not 200 but it has json content type, raise whatever error was in response
    if (res.status !== 200 && res.headers.get('content-type') === 'application/json') {
      let msg = 'An error occured when downloading export';
      try {
        const json = await res.json();
        const _msg = getErrMsg(json);
        if (_msg) {
          msg = _msg;
        }
        toast.add({
          title: 'Export error',
          description: msg,
          icon: 'i-heroicons-exclamation-triangle',
          color: 'red',
        });
      } catch (e) {
        toast.add({
          title: 'Export error',
          description: msg,
          icon: 'i-heroicons-exclamation-triangle',
          color: 'red',
        });
      }

      // if status was 200 and header was a kind of file, download it by using the famous hack
    } else if (
      (res.status === 200 &&
        res.headers.get('content-type') === 'application/octet-stream') ||
      res.headers.get('content-type')?.includes('spreadsheet')
    ) {
      const filename = res.headers
        .get('content-disposition')
        ?.replaceAll('"', '')
        .replace('attachment; filename=', '');

      // ensure filename could be extracted from header
      if (!filename) {
        toast.add({
          title: 'Export error',
          description: 'Server response was not understood',
          icon: 'i-heroicons-exclamation-triangle',
          color: 'red',
        });
      }

      // famous hack
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename!);
      link.click();
      URL.revokeObjectURL(link.href);

      // show toast if response wasnt handled in if else block
    } else {
      toast.add({
        title: 'Export error',
        description: 'Server response was not understood',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red',
      });
    }

    // tell the ui the downloading finished
    doneDownloading(t);
  });
}
</script>
