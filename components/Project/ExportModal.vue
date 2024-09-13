<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
  >
    <UCard>
      <template #header>
        <CardHeader>Create new project export</CardHeader>
      </template>
      <div class="flex flex-col gap-y-9 gap-x-9 w-full">
        <div class="flex flex-col gap-y-3">
          <label class="">Type of export:</label>
          <URadio
            v-for="option in exportTypeOptions"
            v-bind="option"
            v-model="exportType"
          />
        </div>
        <div class="flex flex-col gap-y-3">
          <label class="">Observations to include:</label>
          <URadio
            v-for="option in filterTypeOptions"
            v-bind="option"
            v-model="filterType"
          />
        </div>
      </div>
      <div class="mt-3" v-if="filterType === 'RANGE'">
        <UPopover :popper="{ placement: 'bottom-start' }">
          <div class="flex items-center justify-between gap-x-3">
            <UButton icon="i-heroicons-calendar-days-20-solid" variant="soft" color="blue">
              {{`${format(selectedDateRange.start, 'd MMM, yyyy')} -
              ${format(selectedDateRange.end, 'd MMM, yyyy')}`}}
            </UButton>
          </div>

          <template #panel="{ close }">
            <div class="flex gap-2">
              <!-- durations presets -->
              <div class="hidden sm:flex flex-col py-4">
                <UButton
                  v-for="(range, index) in ranges"
                  :key="index"
                  :label="range.label"
                  variant="link"
                  color="blue"
                  :class="{
                    'bg-gray-100 dark:bg-gray-800': isDurationPresetSelected(range.duration),
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50': isDurationPresetSelected(range.duration),
                  }"
                  truncate
                  @click="selectDurationPreset(range.duration)" />
              </div>
              <DateRangePicker v-model="selectedDateRange" @close="close" />
            </div>
          </template>
        </UPopover>
      </div>
      <div class="mt-6">
        <div class="text-red-500 mb-6 -mt-3" v-if="observationsCount === 0">
          There are no observations in the selected range
        </div>
        <div class="flex items-center gap-x-3">
          <NuxtLink @click.prevent="submitExport()">
            <UButton
              :disabled="observationsCount === null || observationsCount < 1"
            >
              Generate export file
            </UButton>
          </NuxtLink>
          <div class="text-gray-400 text-sm">
              {{ observationsCount === null ? '' : `${observationsCount} observations` }}
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
  const props = defineProps({
    ...requireModalProps,
    project: requireProjectProp,
  });
import { sub, format, isSameDay, type Duration } from 'date-fns';

const {
  generateExport,
  getObservationsCount,
  getExportParams,
  getDayBegin,
} = await useProjectExports(props.project.id);

const observationsCount = ref<number | null>(null);

// daterangepicker v-model
const selectedDateRange = ref({
  start: new Date(props.project.createdAt),
  end: new Date(),
});
const startDate = computed(() => {
  const d: Date = selectedDateRange.value.start;
  return d;
});
const endDate = computed(() => {
  const d: Date = selectedDateRange.value.end;
  return d;
});
const open = computed(() => props.open);

const exportType = ref<ExportType>('NVIVO');
const filterType = ref('ALL');

// set selectedDateRange to project.createdAt -> now when exporting ALL observations
watch([filterType], async ([newFilterType]) => {
  if (newFilterType === 'ALL') {
    selectedDateRange.value.start = getDayBegin(new Date(props.project.createdAt));
    selectedDateRange.value.end = new Date();
  }
});

// call api to figure observationCount
async function calculateNewCount() {
  const params = getExportParams({
    startDate: startDate.value,
    endDate: endDate.value,
    exportType: exportType.value,
  });
  const newCount = await getObservationsCount(params);
  if (typeof newCount === 'number') {
    observationsCount.value = newCount;
  }
}

// calculate new count when startDate, endDate or exportType changes
watch([startDate, endDate, exportType], async () => {
  calculateNewCount();
}, { deep: true, immediate: false });


// calculate observation count on modal open
watch([open], ([isOpen]) => {
  if (isOpen) calculateNewCount();
});

const ranges = [
  { label: 'Last 7 days', duration: { days: 7 } },
  { label: 'Last 14 days', duration: { days: 14 } },
  { label: 'Last 30 days', duration: { days: 30 } },
  { label: 'Last 3 months', duration: { months: 3 } },
  { label: 'Last 6 months', duration: { months: 6 } },
  { label: 'Last year', duration: { years: 1 } },
];
const exportTypeOptions = [{
  value: 'NVIVO',
  label: 'Excel mastersheet',
  help: '.xlsx file with observations including id column for cross-referencing with file exports',
  icon: 'i-heroicons-academic-cap'
}, {
  value: 'UPLOADS',
  label: 'Uploaded observation files',
  help: 'All uploaded files on observations except the primary observation image',
  icon: 'i-heroicons-academic-cap'
}, {
  value: 'MEDIA',
  label: 'Observation images',
  help: 'All primary images of observations',
  icon: 'i-heroicons-academic-cap'
}];

const filterTypeOptions = [{
  value: 'ALL',
  label: 'All observations'
}, {
  value: 'RANGE',
  label: 'Observations in date range'
}];

// function to figure out of duration preset is selected
function isDurationPresetSelected(duration: Duration): boolean {
  const targetBeginDay = sub(new Date(), duration);
  const beginDayMatch: boolean = isSameDay(
    selectedDateRange.value.start,
    targetBeginDay,
  );
  const endDayMatch: boolean = isSameDay(
    selectedDateRange.value.end,
    new Date(),
  );

  return beginDayMatch && endDayMatch;
}

// duration preset button onclick function
async function selectDurationPreset(duration: Duration): Promise<void> {
  selectedDateRange.value = {
    start: sub(new Date(), duration),
    end: new Date()
  };
  const params = getExportParams({
    startDate: startDate.value,
    endDate: endDate.value,
    exportType: exportType.value,
  });
  const newCount = await getObservationsCount(params);
  if (typeof newCount === 'number') {
    observationsCount.value = newCount;
  }
}

async function submitExport(): Promise<void> {
  const config: ExportProjectParams = {
    exportType: exportType.value,
    startDate: startDate.value,
    endDate: endDate.value,
  };

  await generateExport(config);
  props.onClose();
}


</script>