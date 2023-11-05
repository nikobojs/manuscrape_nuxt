<template>
  <UContainer>
    <div class="w-[220px] min-h-[45px] pt-10 pb-6 cursor-pointer" @click="onLogoClick">
      <span class="dark:hidden">
        <img src="/logo/manuscrape-logo-dark.svg"  alt="manuscrape logo dark">
      </span>
      <span class="hidden dark:block">
        <img src="/logo/manuscrape-logo-light.svg" alt="manuscrape logo light">
      </span>
    </div>
    <div class="title">
        <div class="flex">
          <h2 class="text-2xl mb-8">Create account</h2>
        </div>
      </div>
    <UForm
      class="w-80"
      @submit.prevent="submit"
      :validate="validate"
      :state="state"
      ref="form"
    >
      <UFormGroup label="Email" name="email">
        <UInput
          autocomplete="off"
          v-model="state.email"
          type="text"
          placeholder="Enter email"
          required
        />
      </UFormGroup>

      <br />

      <UFormGroup label="Password" name="password">
        <UInput
          autocomplete="off"
          v-model="state.password"
          type="password"
          placeholder="Enter Password"
          required
        />
      </UFormGroup>

      <span class="block mt-3 text-red-500" v-if="errorMessage" v-text="errorMessage"></span>

      <UButton :disabled="loading" :loading="loading" type="submit" class="mt-5">
        Create and login
      </UButton>
      <ULink
        to="/login"
        class="text-sm pl-3 hover:underline"
        active-class="text-primary"
        inactive-class="text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
      >
      I already have an account
      </ULink>
    </UForm>
  </UContainer>
</template>

<script lang="ts" setup>
import type { FormError } from '@nuxt/ui/dist/runtime/types';
import { getErrMsg } from '~/utils/getErrMsg';

  const state = ref({
    email: '',
    password: '',
  });

  const errorMessage = ref('');

  const form = ref();
  const loading = ref(false);

  const { signUp, ensureUserFetched } = await useAuth();
  await ensureUserFetched()

  function validate(state: any): FormError[] {
    const errors = [] as FormError[];
    if (!state.email) errors.push({ path: 'email', message: 'Required' });
    if (state.email.split('').filter((c: string) => c == '@').length !== 1) errors.push({ path: 'email', message: 'Should contain exactly one \'@\''});
    if (state.email.split('').filter((c: string) => c == '.').length < 1) errors.push({ path: 'email', message: 'Should contain at least one \'.\''});
    if (!state.password) errors.push({ path: 'password', message: 'Required' });
    return errors;
  }

  async function submit() {
    await form.value!.validate();
    loading.value = true;
    await signUp(state.value.email, state.value.password).then(() => {
      window.location.href = '/';
    }).catch(err => {
      errorMessage.value = getErrMsg(err)
    }).finally(() => {
      loading.value = false;
    });
  };

  function onLogoClick() {
    navigateTo('/');
  }
  
</script>
