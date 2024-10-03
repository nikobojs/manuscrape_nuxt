<template>
  <UCard
    v-if="typeof observation?.image?.id === 'number'"
    class="overflow-visible"
  >
    <template #header>
      <div class="flex justify-between">
        <div class="relative h-4">
          <CardHeader>Image editor for observation #{{ observation.id }}</CardHeader>
          <UTooltip>
            <template #text>
              <div class="flex flex-col gap-y-2 py-1 max-w-xs break-words whitespace-normal">
                <div class="flex gap-x-2">
                  <UKbd>Q</UKbd>:
                  <span>Grab mode</span>
                </div>
                <div class="flex gap-x-2">
                  <UKbd>W</UKbd>:
                  <span>Text mode</span>
                </div>
                <div class="flex gap-x-2">
                  <UKbd>E</UKbd>:
                  <span>Box mode</span>
                </div>
                <div class="flex gap-x-2">
                  <UKbd>R</UKbd>:
                  <span>Line mode</span>
                </div>
                <div class="flex gap-x-2">
                  <UKbd>Right click</UKbd>:
                  <span>Hold to grab</span>
                </div>
                <div class="flex gap-x-2">
                  <span class="flex gap-x-1">
                    <UKbd>Ctrl</UKbd>+<UKbd>Enter</UKbd>
                  </span>:
                  <span>(Text mode) Save text</span>
                </div>
                <div class="flex gap-x-2">
                  <span class="flex gap-x-1">
                    <UKbd>Esc</UKbd>
                  </span>:
                  <span>(Text mode) Discard text</span>
                </div>
                <div class="flex gap-x-2">
                  <span class="flex gap-x-1">
                    <UKbd>Shift</UKbd>+<UKbd>Scroll</UKbd>
                  </span>:
                  <span>Zoom</span>
                </div>
                <div class="flex gap-x-2">
                  <span class="flex gap-x-1">
                    <UKbd>Shift</UKbd>+<UKbd>W</UKbd>/<UKbd>A</UKbd>/<UKbd>S</UKbd>/<UKbd>D</UKbd>
                  </span>:
                  <span>Move camera</span>
                </div>
              </div>
            </template>
            <div class="text-xs mt-1 text-gray-600 flex items-center gap-x-1">
              Shortcuts
              <UIcon class="text-lg" name="i-heroicons-question-mark-circle" />
            </div>
          </UTooltip>
        </div>
        <div class="flex gap-x-3">

          <!-- Buttons: save & reset image -->
          <UButton
            icon="i-heroicons-trash"
            :disabled="!hasPendingChanges || modeActive(EditorMode.DISABLED)"
            color="rose"
            @click="reset"
            variant="outline"
            size="xs"
          >Reset all changes</UButton>
          <UButton
            icon="i-mdi-content-save-outline"
            :disabled="!hasPendingChanges || modeActive(EditorMode.DISABLED)"
            color="primary"
            @click="save"
            variant="outline"
            size="xs"
          >Overwrite image</UButton>
        </div>
      </div>
    </template>
    <div class="w-full overflow-visible relative" ref="canvasContainer">
      <div
        class="w-full sticky top-0 flex justify-between z-10"
        v-if="!modeActive(EditorMode.DISABLED) && !isSaving"
      >
        <div class="px-3 w-full h-16 right-3 flex justify-between items-center gap-x-3 bg-slate-950 bg-opacity-80">

          <div class="flex items-center gap-x-3">
            <!-- Button group: TEXT colors -->
            <div v-if="modeActive(EditorMode.TEXT)">
              <UButtonGroup
                size="sm"
                orientation="horizontal"
              >
                <label
                  class="h-8 cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 flex-shrink-0 font-medium rounded-s-md gap-x-1.5 px-2.5 py-1.5 shadow-sm disabled:bg-primary-500 dark:disabled:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 inline-flex items-center"
                  :style="{backgroundColor: frontColor, color: 'black'}"
                >
                  <UIcon class="-m-1 text-xl" name="i-heroicons-paint-brush" />
                  <UInput
                    v-show="false"
                    type="color"
                    class="hidden"
                    :disabled="modeActive(EditorMode.DISABLED)"
                    v-model="frontColor"
                  />
                </label>
                <label
                  class="h-8 cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 flex-shrink-0 font-medium rounded-e-md gap-x-1.5 px-2.5 py-1.5 shadow-sm disabled:bg-primary-500 dark:disabled:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 inline-flex items-center"
                  :style="{backgroundColor: backColor, color: 'white'}"
                >
                  <UIcon class="-m-1 text-xl" name="i-heroicons-paint-brush" />
                  <UInput
                    v-show="false"
                    type="color"
                    class="hidden"
                    :disabled="modeActive(EditorMode.DISABLED)"
                    v-model="backColor"
                  />
                </label>
              </UButtonGroup>
            </div>

            <!-- Button group: LINE colors -->
            <div v-if="modeActive(EditorMode.LINE)">
              <label
                class="h-8 cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 flex-shrink-0 font-medium rounded-md gap-x-1.5 px-2.5 py-1.5 shadow-sm disabled:bg-primary-500 dark:disabled:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 inline-flex items-center"
                :style="{backgroundColor: frontColor, color: 'black'}"
              >
                <UIcon class="-m-1 text-xl" name="i-heroicons-paint-brush" />
                <UInput
                  v-show="false"
                  type="color"
                  class="hidden"
                  :disabled="modeActive(EditorMode.DISABLED)"
                  v-model="frontColor"
                />
              </label>
            </div>

            <!-- Button group: BOX colors -->
            <div v-if="modeActive(EditorMode.RECT)">
              <label
                class="h-8 cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 flex-shrink-0 font-medium rounded-md gap-x-1.5 px-2.5 py-1.5 shadow-sm disabled:bg-primary-500 dark:disabled:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 inline-flex items-center"
                :style="{backgroundColor: backColor, color: 'white'}"
              >
                <UIcon class="-m-1 text-xl" name="i-heroicons-paint-brush" />
                <UInput
                  v-show="false"
                  type="color"
                  class="hidden"
                  :disabled="modeActive(EditorMode.DISABLED)"
                  v-model="backColor"
                />
              </label>
            </div>

            <!-- EditorMode.LINE: extra tools -->
            <div class="flex items-center gap-x-3" v-show="modeActive(EditorMode.LINE)">
              <label class="text-xs">Line width:</label>
              <USelectMenu
                :options="lineWidths"
                v-model="lineWidth"
                color="gray"
                variant="outline"
                size="xs"
                value-attribute="value"
                option-attribute="label"
                class="cursor-pointer pl-3 pr-8 h-8"
              >
                <template #label>
                  {{ lineWidth }}px
                </template>
              </USelectMenu>
            </div>

            <!-- EditorMode.TEXT: extra tools -->
            <div class="flex items-center gap-x-3" v-show="modeActive(EditorMode.TEXT)">

              <!-- toggle background transparency -->
              <div class="flex flex-col items-center gap-x-2">
                <div class="text-xs mb-1">Background</div>
                <UToggle
                  :model-value="textDraftSolidBg"
                  @click="() => { setTextDraftSolidBg(!textDraftSolidBg) }"
                />
              </div>

              <form v-if="writing" @submit.prevent="saveTextDraft" class="flex gap-3 items-center">
                  <!-- text draft textarea-->
                  <UTextarea
                    class="ring-inset h-12 dark:ring-inset border-r-0 dark:border-r-0"
                    type="text"
                    ref="textInput"
                    v-model="textDraft"
                    :disabled="modeActive(EditorMode.DISABLED)"
                    @update="(v: string) => {
                      setTextDraft(v);
                      return v;
                    }"
                    placeholder="Enter text"
                  />

                  <!-- save text button-->
                  <UButton
                    color="blue"
                    type="submit"
                    variant="outline"
                    class="saveText"
                  >Save text</UButton>
                  <!-- discard text button-->
                  <UButton
                    color="red"
                    variant="outline"
                    @click="resetTextDraft"
                  >Discard</UButton>
              </form>

                  <!-- font size input field -->
                  <div class="flex items-center gap-x-2">
                    <label class="text-xs">Size:</label>
                    <UInput
                      class="max-w-[70px] text-size-input"
                      :style="{
                        appearance: 'textfield',
                      }"
                      type="number"
                      id="text-size-input"
                      :model-value="textSize"
                      @update:model-value="setTextSize"
                      step="1"
                      variant="outline"
                    />
                  </div>
            </div>
          </div>
          <div class="flex gap-x-3">
            <!-- Buttons: Undo/redo buttons -->
            <UButtonGroup>
              <UButton @click="undo" :disabled="undoDisabled" color="blue" variant="outline" icon="i-heroicons-arrow-uturn-left"></Ubutton>
              <UButton @click="redo" :disabled="redoDisabled" color="blue" variant="outline" icon="i-heroicons-arrow-uturn-right"></Ubutton>
            </UButtonGroup>

            <!-- Buttons: all actions -->
            <UButtonGroup size="sm" orientation="horizontal">
              <UButton
                v-for="[actionMode, { icon, onActionPicked }] in actionButtons"
                :icon="icon"
                color="blue"
                :variant="modeActive(actionMode as unknown as EditorMode) ? 'solid' : 'outline'"
                @click="() => { setMode(actionMode as unknown as EditorMode); onActionPicked() }"
                :disabled="modeActive(EditorMode.DISABLED)"
              />
            </UButtonGroup>

            <!-- Button group: zoom -->
            <UButtonGroup size="sm" orientation="horizontal">
              <UButton
                color="blue"
                variant="outline"
                icon="i-heroicons-magnifying-glass-minus"
                :disabled="modeActive(EditorMode.DISABLED)"
                @click="() => addToZoom(-ZOOM_STEP)"
              ></UButton>
              <UButton
                color="blue"
                variant="outline"
                icon="i-mdi-restore"
                :disabled="modeActive(EditorMode.DISABLED)"
                @click="() => resetZoom()"
              ></UButton>
              <UButton
                color="blue"
                variant="outline"
                icon="i-heroicons-magnifying-glass-plus"
                :disabled="modeActive(EditorMode.DISABLED)"
                @click="() => addToZoom(ZOOM_STEP)"
              ></UButton>
            </UButtonGroup>
          </div>
        </div>
      </div>
      <div class="w-full min-h-[480px] relative transition-all">
        <canvas
          v-show="!isSaving"
          ref="canvas"
          :class="{
            'cursor-progress': cursor === 'progress',
            'cursor-text': cursor === 'text',
            'cursor-move': cursor === 'move',
            'cursor-grab': cursor === 'grab',
            'cursor-grabbing': cursor === 'grabbing',
            'cursor-crosshair': cursor === 'crosshair',
            'bg-[#eeeeee]': !modeActive(EditorMode.DISABLED),
          }"
          :style="{
            backgroundPosition: canvasBackgroundPosition,
            backgroundImage: `url('/cross-bg.png')`,
            backgroundSize: canvasBackgroundSize,
          }"
          :width="canvasRect.x || '100%'"
          :height="canvasRect.y || 'auto'"
        ></canvas>
        <div role="status" v-show="isSaving" class="absolute z-5 justify-center h-full w-full flex items-center">
            <svg aria-hidden="true" class="w-14 h-14 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import type { EditorMode, ZOOM_STEP } from '~/utils/imageEditor';

  const props = defineProps({
    observation: requireObservationProp,
    project: requireProjectProp,
    onSubmit: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
  });

  if (!props.observation?.image?.id) {
    console.error('Observation does not have an image!')
    navigateTo('/')
  }

  const canvas = ref<HTMLCanvasElement>();
  const canvasContainer = ref<HTMLDivElement>();
  const textInput = ref<HTMLInputElement>();
  const frontColor = ref<string>('#ffffff');
  const backColor = ref<string>('#000000');

  const { upsertObservationImage } = await useObservations(props.project?.id);

  const toast = useToast();

  // initialize image editor!
  const {
    actionButtons,
    addToZoom,
    canvasBackgroundPosition,
    canvasBackgroundSize,
    canvasRect,
    createImageFile,
    cursor,
    hasPendingChanges,
    isSaving,
    lineWidth,
    lineWidths,
    modeActive,
    redo,
    redoDisabled,
    removeEventListeners,
    reset,
    resetTextDraft,
    resetZoom,
    saveTextDraft,
    setMode,
    setTextDraft,
    setTextDraftSolidBg,
    setTextSize,
    textDraft,
    textDraftSolidBg,
    textSize,
    undo,
    undoDisabled,
    writing,
  } = useImageEditor(
    props.observation.id,
    props.project.id,
    canvas,
    canvasContainer,
    textInput,
    frontColor,
    backColor,
  );


  function save() {
    createImageFile(async (file: File) => {
      await upsertObservationImage(
        props.project.id,
        props.observation.id,
        file,
      );

      // TODO: wait until redownload+rerender of image somehow
      setTimeout(() => {
        toast.add({
          title: 'Image was saved',
          icon: 'i-heroicons-check',
          color: 'green',
        });
      }, 250);
    })
  }


  onMounted(() => {
    reset();
  });

  onUnmounted(() => {
    removeEventListeners();
  });
  

</script>

<style>
  .cursor-text { cursor: text; }
  .cursor-grab { cursor: grab; }
  .cursor-grabbing { cursor: grabbing; }
  .cursor-crosshair { cursor: crosshair; }
  .text-size-input::-webkit-outer-spin-button,
  .text-size-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>