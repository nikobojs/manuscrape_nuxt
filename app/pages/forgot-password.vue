<template>
  <UContainer class="flex flex-col">
    <div
      class="w-[220px] min-h-[45px] pt-10 pb-6 cursor-pointer"
      @click="onLogoClick"
    >
      <span class="dark:hidden">
        <img src="/logo/manuscrape-logo-dark.svg" alt="manuscrape logo dark" />
      </span>
      <span class="hidden dark:block">
        <img
          src="/logo/manuscrape-logo-light.svg"
          alt="manuscrape logo light"
        />
      </span>
    </div>
    <div class="title">
      <div class="flex">
        <p class="text-2xl mb-8">Forgot password</p>
      </div>
    </div>
    <div class="w-80">
      <form @submit.prevent="forgotPassword">
        <label for="email-input"> Email </label>
        <UInput
          v-model="email"
          type="email"
          name="email"
          class="block mt-1.5"
          placeholder="Enter email"
          autocomplete="on"
          id="email-input"
        />

        <span
          class="block mt-3 text-red-500"
          v-if="error"
          v-text="error"
        ></span>

        <div class="flex gap-x-3">
          <UButton
            class="mt-5"
            type="submit"
            :disabled="loading"
            :loading="loading"
          >
            Reset password
          </UButton>
          <UButton class="mt-5" color="gray" :disabled="loading" to="/login">
            Go to login page
          </UButton>
        </div>
      </form>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const email = ref("");
const error = ref("");
const loading = ref(false);
const toast = useToast();

function onLogoClick() {
  navigateTo("/");
}

function resetInputs() {
  email.value = "";
}

async function forgotPassword() {
  if (!email) {
    error.value = "The email is not defined";
    return;
  }

  error.value = "";
  loading.value = true;
  try {
    await requestForgotPasswordEmail(email.value).then(() => {
      toast.add({
        title: "Email was sent successfully",
        color: "green",
        icon: "i-heroicons-check",
      });
    });
  } catch (e: any) {
    const errMsg = e?.message || e + "" || "Unknown reason, will be reported";
    error.value = errMsg;
    toast.add({
      title: "Unable to request reset password email",
      description: errMsg,
      color: "red",
    });
  } finally {
    loading.value = false;
    resetInputs();
  }
}
</script>
