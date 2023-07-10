<template>
  <div>
    <div class="title">
      <h2>Create account</h2>
    </div>
    <div class="container form">
      <label for="uname"><b>Email</b></label>
      <input
        v-model="user.email"
        type="email"
        class="input"
        placeholder="Enter email"
        name="uname"
        required
      />

      <label for="psw"><b>Password</b></label>
      <input
        v-model="user.password"
        type="password"
        class="input"
        placeholder="Enter Password"
        name="psw"
        required
      />

      <button @click.prevent="login" class="button">Create and login</button>
    </div>
  </div>
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
