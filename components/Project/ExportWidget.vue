<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center h-4">
        <CardHeader>Export</CardHeader>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <p class="text-sm font-bold">Date range</p>

        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton icon="i-heroicons-calendar-days-20-solid">
            {{
              isFullRangeSelected()
                ? 'All observations'
                : `${format(selectedDateRange.start, 'd MMM, yyyy')} - ${format(
                    selectedDateRange.end,
                    'd MMM, yyyy'
                  )}`
            }}
          </UButton>

          <template #panel="{ close }">
            <div class="flex items-center gap-1">
              <div class="hidden sm:flex flex-col py-4">
                <UButton
                  v-for="(range, index) in ranges"
                  :key="index"
                  :label="range.label"
                  variant="outline"
                  color="blue"
                  :class="[
                    isRangeSelected(range.duration)
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  ]"
                  truncate
                  @click="selectRange(range.duration)" />
              </div>

              <DatePicker v-model="selectedDateRange" @close="close" />
            </div>
          </template>
        </UPopover>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-sm font-bold">Export type</p>
        <div>
          <NuxtLink @click.prevent="tryDownload('nvivo')">
            <UButton
              :disabled="downloading.includes('nvivo')"
              :loading="downloading.includes('nvivo')"
              icon="i-mdi-microsoft-excel"
              variant="outline"
              color="blue"
              class="w-36"
              >Spreadsheet</UButton
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
              class="w-36"
              >Images</UButton
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
              class="w-36"
              >Uploads</UButton
            >
          </NuxtLink>
        </div>
      </div>

      <div>{{ observationsCount }} obervations chosen</div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { sub, format, isSameDay, type Duration } from 'date-fns';

const props = defineProps({
  project: requireProjectProp,
});

onMounted(async () => {
  observationsCount.value = await getObservationsCount();
});

const observationsCount = ref(0);

const selectedDateRange = ref({
  start: new Date(props.project.createdAt),
  end: new Date(),
});
const startDate = computed(() => {
  return format(selectedDateRange.value.start, 'yyyy-MM-dd');
});
const endDate = computed(() => {
  return format(selectedDateRange.value.end, 'yyyy-MM-dd');
});

const ranges = [
  { label: 'Last 7 days', duration: { days: 7 } },
  { label: 'Last 14 days', duration: { days: 14 } },
  { label: 'Last 30 days', duration: { days: 30 } },
  { label: 'Last 3 months', duration: { months: 3 } },
  { label: 'Last 6 months', duration: { months: 6 } },
  { label: 'Last year', duration: { years: 1 } },
];

function isFullRangeSelected() {
  return (
    isSameDay(selectedDateRange.value.start, new Date(props.project.createdAt)) &&
    isSameDay(selectedDateRange.value.end, new Date())
  );
}

function isRangeSelected(duration: Duration) {
  return (
    isSameDay(selectedDateRange.value.start, sub(new Date(), duration)) &&
    isSameDay(selectedDateRange.value.end, new Date())
  );
}

async function selectRange(duration: Duration) {
  selectedDateRange.value = { start: sub(new Date(), duration), end: new Date() };
  observationsCount.value = await getObservationsCount();
}

const toast = useToast();
const downloading = reactive<string[]>([]);
const doneDownloading = (t: string) => {
  var index = downloading.indexOf(t);
  if (index !== -1) {
    downloading.splice(index, 1);
  }
};

async function getObservationsCount(): Promise<number> {
  const url = `/api/projects/${props.project.id}/observations/count?start_date=${startDate.value}&end_date=${endDate.value}`;
  const res = await fetch(url);

  return res.json();
}

async function tryDownload(t: string) {
  const url = `/api/projects/${props.project.id}/export?type=${t}&?start_date=${startDate}&end_date=${endDate}`;
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
