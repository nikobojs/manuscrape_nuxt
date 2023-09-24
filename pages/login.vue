<template>
  <div>
    <UContainer class="flex flex-col">
    <div class="title">
      <h2 class="text-3xl mb-8">Sign in to manuscrape</h2>
    </div>
      <div class="w-80">
        <form @submit.prevent="handleLogin">
          <label for="email-input">
            Email
          </label>
          <UInput
            ref="emailInput"
            type="email"
            name="email"
            class="input"
            placeholder="Enter email"
            id="email-input"
            autocomplete="on"
          />

          <br />

          <label for="password-input">
            Password
          </label>
          <UInput
            ref="passwordInput"
            type="password"
            name="password"
            class="input"
            placeholder="Enter Password"
            id="password-input"
            autocomplete="on"
          />

          <span class="block mt-3 text-red-500" v-if="error" v-text="error"></span>

          <UButton class="mt-5" type="submit" :disabled="loading" :loading="loading">
            Log in
          </UButton>
        </form>
      </div>
    </UContainer>
  </div>
</template>


<script lang="ts" setup>
  import { getErrMsg } from '~/utils/getErrMsg';

  const error = ref('')
  const { login, ensureUserFetched } = await useAuth();
  await ensureUserFetched()
  const loading = ref(false);
  const passwordInput = ref();
  const emailInput = ref();

  async function handleLogin() {
    const em = emailInput.value?.input?.value;
    const pw = passwordInput.value?.input?.value;

    // ensure email and password is defined
    if (!em) {
      error.value = 'Email required';
      loading.value = false;
      return;
    }
    if (!pw) {
      error.value = 'Password requried';
      loading.value = false;
      return;
    }

    // begin loading state
    loading.value = true;

    setTimeout(() => {
      // at this point it is safe to assume that the values are truthy
      login(em, pw).then(async (res) => {
        if (res?.token) {
          window.location.href = '/';
        }
      })
      .catch(err => {
        error.value = getErrMsg(err);
      }).finally(() => loading.value = false);

    }, 200);
  }

</script>
