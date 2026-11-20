<template>
  <UCard class="mb-4 pb-6 overflow-visible col-span-5 h-full">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex gap-3">
          <CardHeader>Observations</CardHeader>
          <UBadge variant="soft">{{ totalObservations }} total</UBadge>
          <UBadge color="warning" variant="soft">
            {{ totalDraftObservations }} draft
          </UBadge>
        </div>

        <div class="inline-flex gap-3 -mt-2 -mb-2">
          <div class="w-56">
            <USelectMenu
              variant="outline"
              :items="observationFilterMenuItems"
              v-model="filterOption"
            />
          </div>
          <UButton
            icon="i-heroicons-pencil-square"
            variant="outline"
            @click="addObservationClick"
            :disabled="loading"
            v-if="showCreateButton"
          >
            Create observation
          </UButton>
        </div>
      </div>
    </template>
    <UTable
      v-model:sorting="sorting"
      empty="No observations"
      :data="observations"
      :columns="columns"
      v-if="props.project"
    >
      <template #id-cell="{ row }">
        <NuxtLink
          :href="`/projects/${row.original.projectId}/observations/${row.original.id}${isElectron ? '?electron=1' : ''}`"
        >
          <span class="text-gray-600 pr-1 inline-block">#</span>
          <span class="font-semibold">{{ row.original.id }}</span>
        </NuxtLink>
      </template>
      <template #createdAt-cell="{ row }">
        <span>{{ prettyDate(row.original.createdAt) }}</span>
      </template>
      <template #user-cell="{ row }">
        <span>{{ row.original.user?.name || row.original.user?.email || "Deleted user" }}</span>
      </template>
      <template #isDraft-cell="{ row }">
        <span>{{ row.original.isDraft ? "Yes" : "No" }}</span>
      </template>
      <template #tags-cell="{ row }">
        <ObservationTagListOverflow :tags="row.original.tags" />
      </template>
      <template #actions-cell="{ row }">
        <div class="w-full justify-end flex gap-x-3">
          <div
            v-if="row.original.images?.length"
            @click="() => openObservationImages(row.original)"
          >
            <UIcon
              name="i-heroicons-photo"
              class="text-xl -mt-1 -mb-1 cursor-pointer hover:text-slate-300 transition-colors"
            />
          </div>
          <NuxtLink
            :href="`/projects/${row.original.projectId}/observations/${row.original.id}${isElectron ? '?electron=1' : ''}`"
          >
            <UIcon
              name="i-heroicons-arrow-top-right-on-square"
              class="text-xl -mt-1 -mb-1 hover:text-slate-300 transition-colors"
            />
          </NuxtLink>
          <div
            @click="() => beginDeleteObservation(row.original)"
            v-if="observationIsDeletable(row.original as FullObservation, user, props.project)"
          >
            <UIcon
              name="i-heroicons-trash"
              class="text-red-500 text-xl -mt-1 -mb-1 cursor-pointer hover:text-slate-300 transition-colors"
            />
          </div>
        </div>
      </template>
    </UTable>
    <div class="flex w-full mt-4 -mb-7 justify-center">
      <UPagination
        v-if="totalPages > 1"
        v-model:page="page"
        :total="totalObservations"
        :max="8"
        :page-count="pageSize"
      />
    </div>
  </UCard>
  <!-- TODO: move these modals -->
  <ObservationImageModal
    v-if="selectedObservation?.images"
    :open="openImageDialog"
    :observation="selectedObservation"
    :project="project"
    @close="() => (openImageDialog = false)"
  />
</template>

<script lang="ts" setup>
import type { TableColumn } from "#ui/types";
// import { observationFilterMenuItems } from "#imports";

const error = ref(null);
const loading = ref(false);
const openImageDialog = ref<boolean>(false);
const selectedObservation = ref<null | FullObservation>(null);
const { user, refreshUser } = await useUser();
const { isElectron } = useDevice();
const { report } = useSentry();
const toast = useToast();

const props = defineProps({
  project: requireProjectProp,
  showCreateButton: requireProp<boolean>(Boolean),
  defaultObservationFilter: Number as PropType<keyof typeof ObservationFilter>,
});

const project = computed(() => props.project);
const emit = defineEmits<{ "on-project-updated": [] }>();

const {
  observations,
  totalPages,
  totalObservations,
  totalDraftObservations,
  page,
  pageSize,
  orderBy,
  orderByDirection,
  filterOption,
  refreshObservations,
} = await useObservations(project, props.defaultObservationFilter, false);

const sort = ref({
  column: orderBy.value,
  direction: orderByDirection.value,
});

// tanstack sorting state, kept in sync with the sort ref above
const sorting = computed({
  get: () => [{ id: sort.value.column, desc: sort.value.direction === "desc" }],
  set: (value: { id: string; desc: boolean }[]) => {
    sort.value = {
      column: value[0]?.id ?? sort.value.column,
      direction: value[0]?.desc ? "desc" : "asc",
    };
  },
});

// update useObservation's state when sorting properties are changed by table interactions
watch(
  sort,
  (s) => {
    let anythingChanged = false;
    if (orderBy.value !== s.column) {
      orderBy.value = s.column;
      anythingChanged = true;
    }
    if (orderByDirection.value !== s.direction) {
      orderByDirection.value = s.direction;
      anythingChanged = true;
    }
    if (anythingChanged) {
      refreshObservations();
    }
  },
  { immediate: false },
);

function addObservationClick() {
  if (typeof props.project.id !== "number") {
    throw new Error("Project is not defined");
  }
  loading.value = true;
  createObservation(props.project.id)
    .catch((err) => (error.value = err?.message))
    .catch(() => (loading.value = false))
    .then((res) => {
      // dum ux hack :s
      if (res?.id && props.project.id) {
        navigateTo(`/projects/${props.project.id}/observations/${res.id}`);
      }
    });
}

const columns: TableColumn<any>[] = [
  {
    header: "ID",
    accessorKey: "id",
  },
  {
    header: "Created at",
    accessorKey: "createdAt",
  },
  {
    header: "Submitted by",
    accessorKey: "user",
  },
  {
    header: "Draft",
    accessorKey: "isDraft",
  },
  {
    header: "Tags",
    accessorKey: "tags",
  },
  {
    header: "",
    accessorKey: "actions",
    meta: { class: { td: "text-right" } },
  },
];

function openObservationImages(row: any) {
  selectedObservation.value = row;
  openImageDialog.value = true;
}

async function beginDeleteObservation(row: any) {
  if (typeof row?.id !== "number") {
    const msg =
      "Observation id was not a number, when trying to delete observation";
    const err = new Error(msg);
    report("error", err);
    toast.add({
      title: "An internal error just happened :(",
      description:
        "The error was reported anonymously without including any third-parties.",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
  } else {
    // TODO: create nice confirm box
    const res = confirm(
      `Are you sure you want to delete observation #${row.original.id}?`,
    );
    if (!res) {
      return;
    }

    try {
      await deleteObservation(props.project.id, row.original.id);

      toast.add({
        title: "Observation was deleted",
        color: "success",
        icon: "i-heroicons-check",
      });

      emit("on-project-updated");
    } catch (e) {
      report("error", e as string | Error);
      console.error("delete observation error:", e);
      const msg = getErrMsg(e);
      toast.add({
        title: "Observation was NOT deleted",
        description: msg,
        color: "error",
        icon: "i-heroicons-exclamation-triangle",
      });
    }
  }
}
</script>
