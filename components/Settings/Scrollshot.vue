<template>
  <SettingsBox
    title="Scrollshot settings"
    help="These settings only apply to your local device running ManuScrape and is saved encrypted on disk."
  >
    <form @submit.prevent="updateDeviceSettings" class="w-[100%] max-w-[340px] grid grid-cols-2 gap-y-6">
      <div v-for="(setting, index) in ScrollshotSettingInputs" class="flex flex-col gap-2">

        <div class="flex gap-1">
          <label :for="`${setting.name}-input`" class="text-sm">
            {{ setting.label }}
          </label>
          <UTooltip class="self-center" :ui="{base: 'p-2 text-xs'}">
            <template #text>
              <p class="whitespace-normal break-words">
                {{ setting.help }}
              </p>
            </template>
            <UIcon class="text-md text-gray-300 opacity-60 hover:opacity-100 transition-opacity block" name="i-mdi-information-outline" />
          </UTooltip>
        </div>

        <UInput
          class="max-w-[140px]"
          :name="`${setting.name}`"
          :id="`${setting.name}-input`"
          :type="`${setting.type}`"
          :step="setting.step || 1"
        />
      </div>
      <div v-if="error" class="col-span-2 text-red-500">
        <pre class="max-w-[100%] text-xs whitespace-normal">{{ error }}</pre>
      </div>
      <div class="py-6 flex gap-4">
        <UButton :disabled="saving" type="submit" color="green">
          {{ saving ? 'Saving...' : 'Save scrollshot settings' }}
        </UButton>
        <UButton @click="resetToDefaults" color="gray">Reset to defaults</UButton>
      </div>
    </form>
  </SettingsBox>
</template>

<script lang="ts" setup>
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user } = await useUser();
  const { isElectron } = useDevice();
  const saving = useState('savingDeviceSettings', () => false);
  const openDeleteModal = ref(false);
  const error = ref('');

  async function savingDone() {
    setTimeout(() => {
      saving.value = false;
      enableAllSettingsInputs(ScrollshotSettingInputs);
    }, 300);
  }

  function renderSettings(settings: Record<string, any>) {
    renderScrollshotSettings(settings.scrollshot);
  }

  async function startSaving() {
    saving.value = true;
    disableAllSettingsInputs(ScrollshotSettingInputs);
  }

  async function updateDeviceSettings(event: Event) {
    if (!isElectron) return;

    startSaving();

    // get settings from user input
    const scrollshotPatch = getSettingsPatch(ScrollshotSettingInputs);
    const fullPatch: Record<string, any> = {
      scrollshot: scrollshotPatch,
    };

    // disable all settings input and submit btn
    disableAllSettingsInputs(ScrollshotSettingInputs);

    // try update via the electron client
    window.electronAPI.updateSettings(
      fullPatch,
      (event: Event, patched: Record<string, any>) => {
        error.value = '';
        renderSettings(patched)
        savingDone();
      }, (event: Event, errorMessage: string) => {
        error.value = errorMessage;
        savingDone();
      },
    );
  }

  function resetToDefaults() {
    // ensure we can and want to do this
    if (!isElectron) return;
    const res = confirm(`Are you sure you want to reset all scrollshot settings to their default values?`);
    if (!res) return;

    window.electronAPI.getDefaultSettings((_event: Event, settings: Record<string, any>) => {

      window.electronAPI.updateSettings(settings, (event: Event, patched: Record<string, any>) => {
        error.value = '';
        renderScrollshotSettings(patched.scrollshot)
        savingDone();
      }, (event: Event, errorMessage: string) => {
        error.value = errorMessage;
        savingDone();
      });
    });
  }

  // on mounted, render current settings
  onMounted(() => {
    if (isElectron) {
      window.electronAPI?.getSettings((_event: Event, settings: any) => {
        renderScrollshotSettings(settings.scrollshot);
      });
    }
  });
</script>
