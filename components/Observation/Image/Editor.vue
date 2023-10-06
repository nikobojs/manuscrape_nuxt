<template>
  <UCard
    v-if="typeof observation?.imageId === 'number'"
    class="overflow-visible"
  >
    <template #header>
      <div class="flex justify-between">
        <CardHeader>Image editor for observation #{{ observation.id }}</CardHeader>
        <div class="flex gap-x-3">

          <!-- Buttons: save & reset image -->
          <UButtonGroup>
            <UButton
              icon="i-heroicons-arrow-uturn-down"
              :disabled="!hasPendingChanges || modeActive(EditorMode.DISABLED)"
              color="rose"
              @click="reset"
              variant="outline"
              size="xs"
            >Reset pending changes</UButton>
            <UButton
              icon="i-mdi-content-save-outline"
              :disabled="!hasPendingChanges || modeActive(EditorMode.DISABLED)"
              color="primary"
              @click="save"
              variant="outline"
              size="xs"
            >Overwrite image</UButton>
          </UButtonGroup>

          <!-- Buttons: Undo/redo buttons -->
          <UButtonGroup>
            <UButton @click="undo" :disabled="undoDisabled" color="blue" variant="outline" icon="i-heroicons-arrow-uturn-left"></Ubutton>
            <UButton @click="redo" :disabled="redoDisabled" color="blue" variant="outline" icon="i-heroicons-arrow-uturn-right"></Ubutton>
          </UButtonGroup>

          <!-- Buttons: all actions -->
          <UButtonGroup size="sm" orientation="horizontal">
            <UButton
              v-for="[actionMode, { icon, onActionPicked }] in Object.entries(actions).filter(([k]) => k !== EditorMode.DISABLED.toString())"
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
              @click="zoomOut"
            ></UButton>
            <UButton
              color="blue"
              variant="outline"
              icon="i-mdi-restore"
              :disabled="modeActive(EditorMode.DISABLED)"
              @click="resetZoom"
            ></UButton>
            <UButton
              color="blue"
              variant="outline"
              icon="i-heroicons-magnifying-glass-plus"
              :disabled="modeActive(EditorMode.DISABLED)"
              @click="zoomIn"
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
        <div class="flex items-center gap-x-3" v-if="modeActive(EditorMode.LINE)">
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
        <div class="flex items-center gap-x-3" v-else-if="modeActive(EditorMode.TEXT)">

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
              <!-- save text button-->
              <UButton
                v-if="writing"
                color="red"
                variant="outline"
                @click="resetTextDraft"
              >Discard</UButton>
              <!-- padding range form component (TODO: simplify)-->
              <div
                v-if="textDraftSolidBg"
                class="w-16 flex flex-col h-full content-between"
              >
                <div class="text-xs pb-2">Padding</div>
                <URange
                  color="red"
                  :ui="{
                    background: 'bg-[#1f2a42]',
                  }"
                  :min="10"
                  :max="100"
                  v-model="textDraftBgPadding"
                />
              </div>

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
          'bg-[#080811]': !modeActive(EditorMode.DISABLED),
        }"
        :width="canvasRect.x || '100%'"
        :height="canvasRect.y || 'auto'"
      ></canvas>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import type { EditorMode } from '~/utils/imageEditor';

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
    actions,
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
    textDraftBgPadding,
    textDraftSolidBg,
    textSize,
    writing,
    zoom,
    zoomIn,
    zoomOut,
    redo,
    undo,
    undoDisabled,
    redoDisabled,
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