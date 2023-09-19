<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
  >
    <UCard>
      <template #header>
        Delete user account
      </template>
      <p class="mb-4">
        Your committed observations will be kept, but no one will be able to see you as the author. If you are alone on some projects, they will be deleted permanently.
      </p>
      <UInput class="mb-6" placeholder="Enter password" type="password" v-model="password" />
      <div class="text-red-500 mb-4" v-if="errorMsg">{{ errorMsg }}</div>
      <div class="w-full text-right">
        <UButton color="red" @click="onDeleteUserConfirm">Confirm user deletion</UButton>
      </div>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
  const props = defineProps({
    open: Boolean as PropType<boolean>,
    onClose: Function as PropType<() => void>,
  });

  const password = ref('');
  const toast = useToast();
  const { deleteUser } = await useAuth();
  const { refreshUser } = await useUser();
  const errorMsg = ref<null | string>(null)

  async function onDeleteUserConfirm() {
    try {
      props?.onClose?.()
      await deleteUser(password.value);
      toast.add({
        title: 'Success',
        description: 'Your user was successfully deleted'
      });
      navigateTo('/login')
      await refreshUser();
    } catch(err) {
      errorMsg.value = getErrMsg(err);
    }
  }
</script>