<template>
<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
    :ui="{
      base: 'relative text-left rtl:text-right overflow-hidden flex flex-col'
    }"
  >
    <UCard>
      <template #header>Edit collaborator alias</template>
      <div class="text-sm mb-3">
        The collaborator alias is only available to the project owners. They won't see that you changed their alias, and it will only affect the exported files.
      </div>
      <div class="mb-3 text-sm">
        Current alias: <span class="font-bold">{{ collaborator.nameInProject }}</span>
      </div>
      <div>
        <UInput
          placeholder="Enter new alias"
          v-model="newAlias"
        />
      </div>
      
      <template #footer>
        <div class="flex gap-3 justify-end flex-wrap">
          <UButton @click="submit" variant="outline" color="primary">
            Save
          </UButton>
          <UButton @click="onClose" color="gray" variant="outline">
            Cancel
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
</template>

<script lang="ts" setup>
  const props = defineProps({
    project: requireProjectProp,
    ...requireModalProps,
    collaborator: requireCollaboratorProp,
  });

  const newAlias = ref('');


  function submit() {
    // NIKOOOOOOOOOOOOOOOOOOOOOOO
    props.onClose()
  }
</script>