<template>
  <div>
    <div class="title">
      <h2>Login</h2>
    </div>
    <div class="container form">
      <form @submit.prevent="handleLogin">
        <label for="email-input">
          Email
        </label>
        <input
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
        <input
          v-model="form.password"
          type="password"
          class="input"
          placeholder="Enter Password"
          id="password-input"
          required
        />

        <br />
        <br />

        <input type="submit" value="Log in" :disabled="loading == true"  />
        <span v-text="form.error"></span>
      </form>
    </div>
  </div>
</template>
<script lang="ts" setup>
  const form = ref({
    email: '',
    password: '',
    error: '',
  });

  const { login } = await useAuth();
  const loading = ref(false);

  async function handleLogin() {
    loading.value = true;
    setTimeout(() => {
      login(form.value.email, form.value.password).catch(err => {
        form.value.error = (err?.statusMessage || err?.message).toString();
      }).finally(() => loading.value = false);
    }, 200);
  }

</script>
