<template>
  <UContainer>
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
        <ULink
          to="/login"
          class="text-2xl mb-8 text-slate-600 hover:text-green-500 hover:underline"
        >
          Sign in
        </ULink>
        <h2 class="text-2xl mb-8 px-2">/</h2>
        <ULink to="/user/new" class="text-2xl mb-8">Create account</ULink>
      </div>
    </div>
    <UForm
      class="w-80"
      @submit="submit"
      :validate="validate"
      :state="state"
    >
      <UFormField label="Full Name" name="name">
        <template #label>
          <div class="flex gap-1 items-center">
            <span>Full Name</span>
            <UTooltip :ui="{ content: 'p-2 text-xs' }">
              <template #content>
                <p class="whitespace-normal break-words">
                  Visible to project collaborators and on project exports
                </p>
              </template>
              <UIcon name="i-heroicons-information-circle" class="text-lg" />
            </UTooltip>
          </div>
        </template>
        <UInput
          autocomplete="off"
          v-model="state.name"
          type="text"
          placeholder="Enter full name"
          required
        />
      </UFormField>

      <br />

      <UFormField label="Email" name="email">
        <UInput
          autocomplete="off"
          v-model="state.email"
          type="text"
          placeholder="Enter email"
          required
        />
      </UFormField>

      <br />

      <UFormField label="Password" name="password">
        <UInput
          autocomplete="off"
          v-model="state.password"
          type="password"
          placeholder="Enter Password"
          required
        />
      </UFormField>

      <span
        class="block mt-3 text-red-500"
        v-if="errorMessage"
        v-text="errorMessage"
      ></span>

      <UButton
        :disabled="loading || showCaptchaModal"
        :loading="loading"
        type="submit"
        class="mt-5"
      >
        Create and login
      </UButton>
      <ULink
        to="/login"
        class="text-sm pl-3 hover:underline"
        active-class="text-primary"
        inactive-class="text-gray-500 hover:text-gray-200"
      >
        I already have an account
      </ULink>
    </UForm>

    <!-- the captcha runs in a modal because the sign-up page is shown in
         the Electron app, where the window has a fixed size -->
    <UModal v-model:open="showCaptchaModal">
      <template #content>
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <template #header>
          <CardHeader>Human verification</CardHeader>
        </template>

        <p class="text-sm mb-3 text-gray-400">
          Verifying that you are human. This happens automatically and should
          only take a moment...
        </p>
        <altcha-widget
          challenge="/api/captcha/challenge"
          theme="auto"
          @statechange="onCaptchaStateChange"
        />
      </UCard>
      </template>
    </UModal>
  </UContainer>
</template>

<script lang="ts" setup>
import type { FormError } from "#ui/types";
import { getErrMsg } from "~/utils/getErrMsg";
import { captureException } from "@sentry/vue";

definePageMeta({ middleware: "guest" });

const state = ref({
  name: "",
  email: "",
  password: "",
});

const errorMessage = ref("");
const { user, signUp, refreshUser } = await useAuth();

const loading = ref(false);
const showCaptchaModal = ref(false);

function onCaptchaStateChange(ev: Event) {
  const detail = (ev as CustomEvent<{ payload?: string; state?: string }>)
    .detail;
  // the widget solved the challenge - close the modal and sign up
  if (detail?.state === "verified" && detail.payload) {
    showCaptchaModal.value = false;
    doSignUp(detail.payload);
  }
}

const {isElectron}=useDevice();

function validate(state: any): FormError[] {
  const errors = [] as FormError[];
  if (!state.name) errors.push({  name: "name", message: "Required" });
  if (!state.email) errors.push({  name: "email", message: "Required" });
  if (state.email.split("").filter((c: string) => c == "@").length !== 1)
    errors.push({  name: "email", message: "Should contain exactly one '@'" });
  if (state.email.split("").filter((c: string) => c == ".").length < 1)
    errors.push({  name: "email", message: "Should contain at least one '.'" });
  if (!state.password) errors.push({  name: "password", message: "Required" });
  return errors;
}

async function submit() {
  // UForm has validated the fields by the time this runs.
  // Captcha verification happens in the modal that opens here.
  showCaptchaModal.value = true;
}

async function doSignUp(captcha: string) {
  loading.value = true;
  await signUp(
    state.value.email,
    state.value.password,
    state.value.name,
    captcha,
  )
    .then(async () => {
      if (isElectron.value) {
        if (window.electronAPI) {
          window.electronAPI.signupSuccess(
            () => {},
            (err: any) => {
              errorMessage.value = typeof err === "string" ? err : getErrMsg(err);
            }
          );
        } else {
          console.warn('window.electronAPI not available in Electron environment');
        }
      } else {
        // Verify the session and go to the projects overview
        await refreshUser();
        if (user.value) {
          await navigateTo("/projects");
        } else {
          const msg = "Account created, but the session could not be verified. Please log in.";
          errorMessage.value = msg;
          captureException(new Error(msg));
        }
      }
    })
    .catch((err) => {
      errorMessage.value = getErrMsg(err);
    })
    .finally(() => {
      loading.value = false;
    });
}

function onLogoClick() {
  navigateTo("/");
}
</script>
