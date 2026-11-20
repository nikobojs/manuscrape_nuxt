<template>
  <div>
    <UContainer class="flex flex-col">
      <div
        class="w-[220px] min-h-[45px] pt-10 pb-6 cursor-pointer"
        @click="onLogoClick"
      >
        <span>
          <img
            src="/logo/manuscrape-logo-light.svg"
            alt="manuscrape logo light"
          />
        </span>
      </div>
      <div class="title">
        <div class="flex">
          <ULink to="/login" class="text-2xl mb-8">Sign in</ULink>
          <h2 class="text-2xl mb-8 px-2">/</h2>
          <ULink
            to="/user/new"
            class="text-2xl mb-8 text-slate-600 hover:text-green-500 hover:underline"
          >
            Create account
          </ULink>
        </div>
      </div>
      <UForm
        class="w-80"
        @submit="handleLogin"
        :validate="validate"
        :state="state"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            type="email"
            name="email"
            placeholder="Enter email"
            id="email-input"
            autocomplete="on"
          />
        </UFormField>

        <br />

        <UFormField label="Password" name="password">
          <UInput
            v-model="state.password"
            type="password"
            name="password"
            placeholder="Enter Password"
            id="password-input"
            autocomplete="on"
          />
        </UFormField>

        <span
          class="block mt-3 text-red-500"
          v-if="error"
          v-text="error"
        ></span>
        <div class="mt-3">
          <ULink
            to="/forgot-password"
            class="text-sm hover:underline"
            active-class="text-primary"
            inactive-class="text-gray-500 hover:text-gray-200"
          >
            Forgot password?
          </ULink>
        </div>

        <div class="flex items-center gap-x-3 mt-5">
          <UButton
            class="px-6"
            type="submit"
            :disabled="loading"
            :loading="loading"
          >
            Log in
          </UButton>
          <div v-if="showWayf">
            <UButton @click="loginWithSaml">Login with WAYF</UButton>
          </div>
        </div>
      </UForm>
    </UContainer>
  </div>
</template>

<script lang="ts" setup>
import type { FormError } from "#ui/types";
import { getErrMsg } from "~/utils/getErrMsg";
import { captureException } from "@sentry/vue";

definePageMeta({ middleware: "guest" });

const error = ref("");
const { login, user, refreshUser } = await useAuth();
const route = useRoute();
const showWayf = ref(!!route.query?.wayf);
const loading = ref(false);
const state = ref({
  email: "",
  password: "",
});

function validate(state: any): FormError[] {
  const errors = [] as FormError[];
  if (!state.email) errors.push({ name: "email", message: "Required" });
  if (!state.password) errors.push({ name: "password", message: "Required" });
  return errors;
}

// Where to send the user after a successful login
function getRedirectTo(): string {
  const fromQuery = route.query.redirect_to as string | undefined;
  if (
    fromQuery &&
    fromQuery.startsWith("/") &&
    !fromQuery.startsWith("//") &&
    !fromQuery.includes("http")
  ) {
    return fromQuery;
  }
  return "/projects";
}

const loginWithSaml = () => {
  window.location.href = "/api/auth/saml/login";
};
const { isElectron } = useDevice();

// UForm has validated the fields by the time this runs
async function handleLogin() {
  const em = state.value.email;
  const pw = state.value.password;

  // begin loading state
  loading.value = true;

  try {
    await login(em, pw);

    if (isElectron.value) {
      if (window.electronAPI) {
        window.electronAPI.loginSuccess(() => {}, (err: any) => {
          error.value = typeof err === "string" ? err : getErrMsg(err);
        });
      } else {
        console.warn(
          "window.electronAPI not available in Electron environment",
        );
      }
    } else {
      await refreshUser();
      if (user.value) {
        await navigateTo(getRedirectTo());
      } else {
        const msg =
          "Logged in, but the session could not be verified. Please try logging in again.";
        error.value = msg;
        captureException(new Error(msg));
      }
    }
  } catch (err) {
    error.value = getErrMsg(err);
  } finally {
    loading.value = false;
  }
}

function onLogoClick() {
  navigateTo("/");
}

onMounted(() => {
  showWayf.value = !!route.query?.wayf;
});
</script>
