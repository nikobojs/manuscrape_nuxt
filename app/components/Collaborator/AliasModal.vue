<template>
  <UModal
    :open="open"
    @update:open="(value) => { if (!value) emit('close') }"
    :ui="{
      content: 'relative text-left rtl:text-right overflow-hidden flex flex-col',
    }"
  >
    <template #content>
      <UCard>
        <template #header>Edit collaborator alias</template>
        <div class="text-sm mb-3">
          The collaborator alias is only available to the project owners. They
          won't see that you changed their alias, and it will only affect the
          exported files.
        </div>
        <div class="mb-3 text-sm">
          Current alias:
          <span class="font-bold">{{ collaborator.nameInProject }}</span>
        </div>
        <div>
          <UInput placeholder="Enter new alias" v-model="newAlias" />
        </div>

        <template #footer>
          <span class="text-red-500 block mb-3" v-if="error">{{ error }}</span>
          <div class="flex gap-3 justify-end flex-wrap">
            <UButton @click="submit" variant="outline" color="primary">
              Save
            </UButton>
            <UButton @click="emit('close')" color="neutral" variant="outline">
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
const props = defineProps({
  project: requireProjectProp,
  ...requireModalProps,
  collaborator: requireCollaboratorProp,
});

const emit = defineEmits<{
  close: [];
}>();

const newAlias = ref("");
const error = ref("");
const { params } = useRoute();
const { refreshUser } = await useUser();
const { patchCollaborator } = await useProjects(params);
const toast = useToast();

function submit() {
  const patch = { nameInProject: newAlias.value };
  error.value = "";
  patchCollaborator(props.project.id, props.collaborator.user_id, patch)
    .then(async (res) => {
      const json = await res.json();
      if (res.status !== 200) {
        throw new Error(getErrMsg(json));
      }
      await refreshUser();
      toast.add({
        title: `The alias for ${props.collaborator.user_email} was updated successfully.`,
        color: "success",
        icon: "i-heroicons-check",
      });

      emit('close');
      setTimeout(() => {
        newAlias.value = "";
      }, 300);
    })
    .catch((err) => {
      error.value = err;
    });
}
</script>
