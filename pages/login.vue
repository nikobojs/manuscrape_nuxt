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
            v-model="form.email"
            type="email"
            class="input"
            placeholder="Enter email"
            id="email-input"
            required
          />

          <br />

          <label for="password-input">
            Password
          </label>
          <UInput
            v-model="form.password"
            type="password"
            class="input"
            placeholder="Enter Password"
            id="password-input"
            required
          />

          <span class="block mt-3 text-red-500" v-if="form.error" v-text="form.error"></span>

          <UButton class="mt-5" type="submit" :disabled="loading" :loading="loading">
            Log in
          </UButton>
        </form>
      </div>
    </UContainer>
  </div>
</template>


<script lang="ts" setup>
  const form = ref({
    email: '',
    password: '',
    error: '',
  });

  const { login, ensureUserFetched } = await useAuth();
  await ensureUserFetched()
  const loading = ref(false);

  async function handleLogin() {
    loading.value = true;
    setTimeout(() => {
      login(form.value.email, form.value.password).then(async (response) => {
        if (response?.token) {
          window.location.href = '/';
        }
      })
      .catch(err => {
        form.value.error = (err?.statusMessage || err?.message).toString();
      }).finally(() => loading.value = false);
    }, 200);
  }

</script>
