<template>
  <div
    v-if="typeof observation?.id === 'number'
      && typeof project?.id === 'number'
      && typeof observation?.imageId === 'number'"
  >
    <div class="mb-4 w-full">
      <p>Editing image for observation #{{ observation.id }}</p>
      <div class="w-full border-b-gray-600 border-b mb-4 mt-4"></div>
      <div class="flex gap-4">
        <UButton icon="i-heroicons-arrow-uturn-down" :disabled="!hasPendingChanges" color="rose" @click="reset" variant="outline">Reset pending changes</UButton>
        <UButton icon="i-mdi-content-save-outline" :disabled="!hasPendingChanges" color="primary" @click="save" variant="outline">Save and overwrite</UButton>
      </div>
    </div>
    <canvas ref="canvas" class="cursor-crosshair"></canvas>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onSubmit: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
  });

  if (!props.observation?.id || !props.project?.id) {
    throw new Error('Project id or observation id is not defined in url params')
  }

  if (!props.observation?.imageId) {
    console.error('Observation does not have an image!')
    navigateTo('/')
  }

  const canvas = ref<undefined | HTMLCanvasElement>();
  const context = computed(() => canvas.value ? canvas.value.getContext("2d") : null);
  
  const { upsertObservationImage } = await useObservations(props.project?.id);

  const color = ref('black');
  const beginX = ref(0);
  const beginY = ref(0);
  const squares = ref<Square[]>([]);
  const toast = useToast();
  const dragging = ref(false);
  const hasPendingChanges = computed(() => squares.value.length > 0);

  const lastReload = ref(new Date());
  const image = computed(() => {
    const d = lastReload.value;

    if (typeof props.observation?.id !== 'number' || typeof props.project?.id !== 'number') {
      throw new Error('Props are not defined correctly');
    }

    const bg = new Image();
    bg.src = `/api/projects/${props.project.id}/observations/${props.observation.id}/image?v=${d.getTime()}`
    bg.addEventListener('load', () => {
      if (canvas.value && context.value) {
        canvas.value.width = bg.width;
        canvas.value.height = bg.height;
        context.value.drawImage(bg, 0, 0, bg.width, bg.height);
      }
    });
  
    return bg;
  });

  function reloadImage() {
    lastReload.value = new Date();
  }

  async function save() {
    const cvs = canvas.value;
    if (!cvs) {
      throw new Error('Canvas is not support. Your browser might need to be updated');
    }
    if (!props.project?.id) {
      throw new Error('Project is not defined');
    }

    cvs.toBlob(async (blob) => {
      if (!props.project?.id || !props.observation?.id) {
        throw new Error('Project or observation is not defined');
      }

      if (blob == null) {
        throw new Error('Image data could not be extracted from canvas');
      }

      const file = new File([blob], 'image.jpg', { type: 'image/jpeg', lastModified: 0})

      await upsertObservationImage(
        props.project.id,
        props.observation.id,
        file,
      );

      toast.add({
        title: 'Image was overwritten',
        icon: 'i-heroicons-check',
      });

      reloadImage();
      reset();

      navigateTo(`/projects/${props.project.id}/observations/${props.observation.id}`);
    }, 'image/jpeg', 1);
  }

  function onMouseDown(ev: MouseEvent) {
    if (context.value) {
      beginX.value = ev.offsetX;
      beginY.value = ev.offsetY;
      dragging.value = true;
    } else {
      console.warn('Ignoring onMouseDown event')
    }
  }

  function onMouseUp(ev: MouseEvent) {
    if (context.value && dragging.value) {
      const endX = ev.offsetX;
      const endY = ev.offsetY;
  
      // TODO: support boxes made from other direction
      const square: Square = [
        beginX.value,
        beginY.value,
        endX - beginX.value,
        endY - beginY.value
      ];
      squares.value.push(square);
      dragging.value = false;
      clearCanvas();
      drawSquares();
    } else {
      console.warn('Ignoring onMouseUp event')
    }
  }

  function drawSquare(
    square: Square,
  ) {
    const ctx = context.value;
    if (!ctx) return;
    ctx.fillStyle = color.value;

    // TODO: support boxes made from other direction
    const [x, y, w, h] = square;
    ctx.fillRect(x, y, w, h);
  }

  function clearCanvas() {
    const cvs = canvas.value;
    const ctx = context.value;
    if (
      !ctx ||
      !cvs ||
      typeof props.observation?.id !== 'number' ||
      typeof props.project?.id !== 'number'
    ) {
      return;
    }

    // cvs.width = image.value.width;
    // cvs.height = image.value.height;
    ctx.clearRect(0, 0, image.value.width, image.value.height);
    ctx.drawImage(image.value, 0, 0, image.value.width, image.value.height);
  }

  function onMouseMove(ev: MouseEvent) {
    if (context.value) {
      if (dragging.value) {
        const endX = ev.offsetX;
        const endY = ev.offsetY;
        // TODO: support boxes made from other direction
        const square: Square = [
          beginX.value,
          beginY.value,
          endX - beginX.value,
          endY - beginY.value
        ];
        clearCanvas();
        drawSquare(square);
        drawSquares();
      }
    }
  }

  function drawSquares() {
    if (!context.value) {
      throw new Error('Context is not defined');
    }
    for (let i = 0; i < squares.value.length; i++) {
      const square = squares.value[i];
      drawSquare(square);
    }

  }

  function reset() {
    if (
      canvas.value &&
      context.value
    ) {
      clearCanvas();
      canvas.value.removeEventListener('mousedown', onMouseDown);
      canvas.value.removeEventListener('mouseup', onMouseUp);
      canvas.value.removeEventListener('mousemove', onMouseMove);
      canvas.value.addEventListener('mousedown', onMouseDown);
      canvas.value.addEventListener('mouseup', onMouseUp);
      canvas.value.addEventListener('mousemove', onMouseMove);
      squares.value = [];
      dragging.value = false;
    } else {
      throw new Error('Canvas or canvas context is not defined!')
    }
  }

  onMounted(() => {
    reset();
  });

  onUnmounted(() => {
    if (canvas.value) {
      canvas.value.removeEventListener('mousedown', onMouseDown);
      canvas.value.removeEventListener('mouseup', onMouseUp);
      canvas.value.removeEventListener('mousemove', onMouseMove);
    }
  })
  </script>