<template>
  <div>
    <UContainer class="flex flex-col">
      <div
        class="w-[220px] min-h-[45px] pt-10 pb-6 cursor-pointer"
        @click="onLogoClick"
      >
        <span class="dark:hidden">
          <img
            src="/logo/manuscrape-logo-dark.svg"
            alt="manuscrape logo dark"
          />
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
          <ULink to="/login" class="text-2xl mb-8">Sign in</ULink>
          <h2 class="text-2xl mb-8 px-2">/</h2>
          <ULink
            to="/user/new"
            class="text-2xl mb-8 dark:text-slate-600 hover:dark:text-green-500 hover:text-green-500 hover:underline"
          >
            Create account
          </ULink>
        </div>
      </div>
      <div class="w-80">
        <form @submit.prevent="handleLogin">
          <label for="email-input"> Email </label>
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

          <label for="password-input"> Password </label>
          <UInput
            ref="passwordInput"
            type="password"
            name="password"
            class="input"
            placeholder="Enter Password"
            id="password-input"
            autocomplete="on"
          />

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
              inactive-class="text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
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
        </form>
      </div>
    </UContainer>
  </div>
</template>

<script lang="ts" setup>
// import { getErrMsg } from '~/utils/getErrMsg';

const error = ref("");
const { login, user, refreshUser } = await useAuth();
// await ensureUserFetched();
const route = useRoute();
const showWayf = ref(!!route.query?.wayf);
const loading = ref(false);
const passwordInput = ref();
const emailInput = ref();
const loginWithSaml = () => {
  window.location.href = "/api/auth/saml/login";
};
const {isElectron}=useDevice();

async function handleLogin() {
  const em = emailInput.value?.input?.value;
  const pw = passwordInput.value?.input?.value;

  // ensure email and password is defined
  if (!em) {
    error.value = "Email required";
    loading.value = false;
    return;
  }
  if (!pw) {
    error.value = "Password required";
    loading.value = false;
    return;
  }

  // begin loading state
  loading.value = true;

  setTimeout(() => {
    // at this point it is safe to assume that the values are truthy
     login(em, pw)
       .then(async (res) => {
         console.log('Login API response:', res);
         console.log('isElectron:', isElectron.value);
         console.log('window.electronAPI exists:', typeof window !== 'undefined' && !!window.electronAPI);
         
         if (isElectron.value) {
           if (window.electronAPI) {
             console.log('Calling window.electronAPI.loginSuccess()');
             window.electronAPI.loginSuccess(
               () => console.log('Electron loginSuccess callback: Success'),
               (error: any) => console.error('Electron loginSuccess callback: Error:', error)
             );
           } else {
             console.warn('window.electronAPI not available in Electron environment');
           }
         } else {
           if (res?.token) {
             window.location.href = "/";
           }
         }


        
      })
      .catch((err) => {
        error.value = getErrMsg(err);
      })
      .finally(() => (loading.value = false));
  }, 200);
}

function onLogoClick() {
  navigateTo("/");
}

onMounted(() => {
  showWayf.value = !!route.query?.wayf;
});
</script>
