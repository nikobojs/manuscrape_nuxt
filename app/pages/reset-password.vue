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
        <p class="text-2xl mb-8">Reset password</p>
      </div>
    </div>
    <div class="w-80">
      <form @submit.prevent="resetPassword">
        <label for="email-input"> New password </label>
        <UInput
          v-model="pw0"
          type="password"
          name="pw0"
          class="block mt-1.5"
          placeholder="Enter password"
          autocomplete="off"
        />

        <br />

        <label for="password-input"> Repeat password </label>
        <UInput
          v-model="pw1"
          type="password"
          name="pw1"
          class="block mt-1.5"
          placeholder="Enter password"
          autocomplete="off"
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
            Save new password
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
const pw0 = ref("");
const pw1 = ref("");
const error = ref("");
const loading = ref(false);
const toast = useToast();
const route = useRoute();
const token = route.query?.token as string;

await callOnce(async () => {
  if (!token || typeof token !== "string") {
    return navigateTo("/login");
  }
});

function onLogoClick() {
  navigateTo("/");
}

function resetInputs() {
  pw0.value = "";
  pw1.value = "";
}

async function resetPassword() {
  if (pw0.value !== pw1.value) {
    error.value = "The passwords are not identical";
    return;
  }

  error.value = "";
  loading.value = true;
  try {
    await postPasswordReset(token, pw0.value).then(() => {
      toast.add({
        title: "Password was reset successfully",
        color: "green",
        icon: "i-heroicons-check",
      });
      navigateTo("/login");
    });
  } catch (e: any) {
    const errMsg = e?.message || e + "" || "Unknown reason, will be reported";
    error.value = errMsg;
    toast.add({
      title: "Unable to reset password",
      description: errMsg,
      color: "red",
    });
  } finally {
    loading.value = false;
    resetInputs();
  }
}
</script>
