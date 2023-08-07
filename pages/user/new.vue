<template>
  <UContainer>
    <div class="title">
      <h2 class="text-3xl mb-8">Create account</h2>
    </div>
    <div class="w-80">
      <label for="uname"><b>Email</b></label>
      <UInput
        v-model="user.email"
        type="email"
        placeholder="Enter email"
        required
      />

      <br />

      <label for="psw"><b>Password</b></label>
      <UInput
        v-model="user.password"
        type="password"
        placeholder="Enter Password"
        required
      />

      <UButton type="submit" @click.prevent="login" class="mt-5">
        Create and login
      </UButton>
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
  const user = ref({
    email: '',
    password: '',
  });

  const login = async () => {
    const response = await useFetch('/api/user', {
      method: 'POST',
      body: user,
    })
  };
</script>
