<template>
  <UCard
    v-if="typeof observation?.imageId === 'number'"
    class="overflow-visible"
  >
    <template #header>
      <div class="flex justify-between">
        <div class="relative h-4">
          <CardHeader>Image editor for observation #{{ observation.id }}</CardHeader>
          <UTooltip
            :ui="{
              base: 'invisible lg:visible px-2 py-1 text-xs font-normal block',
            }"
          >
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
    </template>
    <div
      class="w-full relative"
      v-if="modeActive(EditorMode.LINE) || modeActive(EditorMode.RECT) || modeActive(EditorMode.TEXT)"
    >

      <div class="mb-4 absolute px-3 pt-2 pb-2 rounded-md right-3 top-3 z-10 flex justify-end items-end gap-x-3 bg-slate-950 bg-opacity-80">

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

          <form @submit.prevent="saveTextDraft" class="flex gap-3 items-end">
              <!-- text draft textarea-->
              <UTextarea
                class="ring-inset h-12 dark:ring-inset border-r-0 dark:border-r-0"
                v-if="writing"
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
                v-if="writing"
                color="blue"
                type="submit"
                variant="outline"
                class="saveText"
              >Save text</UButton>
              <!-- discard text button-->
              <UButton
                v-if="writing"
                color="red"
                variant="outline"
                @click="resetTextDraft"
              >Discard</UButton>

              <!-- toggle background transparency -->
              <div class="flex flex-col items-center gap-x-2">
                <div class="text-xs mb-1">Background</div>
                <UToggle
                  :model-value="textDraftSolidBg"
                  @click="() => { setTextDraftSolidBg(!textDraftSolidBg) }"
                />
              </div>

              <!-- font size select/dropdown component -->
              <USelect
                :options="fontSizes"
                v-model="textSize"
                size="sm"
                color="gray"
                variant="outline"
                value-attribute="value"
                option-attribute="label"
                class="text-xs cursor-pointer pl-2 pr-2 h-8"
                placeholder=""
                :ui="{
                  trailing: {
                    padding: {
                      '2xs': 'pe-0',
                      'xs': 'pe-0',
                      'sm': 'pe-0',
                      'md': 'pe-0',
                      'lg': 'pe-0',
                      'xl': 'pe-0'
                    }
                  },
                  color: {
                    white: {
                      outline: 'shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-0',
                    },
                    gray: {
                      outline: 'shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ring-0',
                    }
                  },
                }"
              >
                <template #trailing><div class="hidden"></div></template>
              </USelect>
          </form>
        </div>

        <!-- Button group: colors -->
        <div>
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
      </div>
    </div>
    <div class="w-full overflow-visible relative" ref="canvasContainer">
      <UBadge class="flex items-center opacity-70 absolute right-3 top-3" color="blue" size="xs" >
        <div class="flex items-start gap-x-1 pt-1">
          <UIcon name="i-heroicons-magnifying-glass" />
          <div class="font-mono">{{  Math.round(zoom * 100)  }}%</div>
        </div>
      </UBadge>
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

  if (!props.observation?.imageId) {
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
    canvasRect,
    createImageFile,
    cursor,
    destroyEditor,
    resetTextDraft,
    fontSizes,
    hasPendingChanges,
    isSaving,
    lineWidth,
    lineWidths,
    modeActive,
    reset,
    resetZoom,
    saveTextDraft,
    setMode,
    setTextDraft,
    setTextDraftSolidBg,
    textDraft,
    textDraftSolidBg,
    textSize,
    writing,
    zoom,
    addToZoom,
    redo,
    undo,
    undoDisabled,
    redoDisabled,
    canvasBackgroundPosition,
    canvasBackgroundSize,
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

      toast.add({
        title: 'Image was overwritten',
        icon: 'i-heroicons-check',
      });
    })
  }


  onMounted(() => {
    destroyEditor();
    reset();
  });

  onUnmounted(() => {
    destroyEditor();
  })
  

</script>

<style>
  .cursor-text { cursor: text; }
  .cursor-grab { cursor: grab; }
  .cursor-grabbing { cursor: grabbing; }
  .cursor-crosshair { cursor: crosshair; }
</style>