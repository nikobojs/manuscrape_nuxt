import { EditorMode, ImageEditorActionConfig, ZOOM_STEP, applyCamera, applyZoom, mousePosition, mouseRect, scale } from "~/utils/imageEditor";

export function useImageEditor(
  observationId: number,
  projectId: number,
  canvas: Ref<HTMLCanvasElement | undefined>,
  container: Ref<HTMLDivElement | undefined>,
  textInput: Ref<HTMLInputElement | undefined>,
  frontColor: Ref<string>,
  backColor: Ref<string>
) {
  const aspectRatio = ref(1);
  const zoom = ref(1);
  const beginX = ref(0);
  const beginY = ref(0);
  const isSaving = ref(false);
  const squares = ref<SquareWithZoom[]>([]);
  const draftLine = ref<Line>();
  const lines = ref<Line[]>([]);
  const dragging = ref(false);
  const grabbing = ref(false);
  const draftTextPosition = ref<[number, number] | undefined>();
  const grabbed = ref<{ x: number; y: number } | undefined>()
  const writing = ref<boolean>(false);
  const textDraft = ref<string>('');
  const textSize = ref<number>(24);
  const lineWidth = ref<number>(5);
  const cameraPosition = ref<[number, number]>([0, 0]);
  const hasPendingChanges = computed(() => squares.value.length > 0 || texts.value.length > 0 || lines.value.length > 0);

  function draw() {
    // wipe and redraw
    clearCanvas();
    drawImage();
    drawSquares();
    drawLines();
    drawTexts(zoom.value);
  }

  // redraw the whole thing when ui stuff changes
  watch([textSize, textDraft, frontColor, backColor], () => {
    draw();
  });

  const mode = ref<EditorMode>(EditorMode.DISABLED);
  const lastReload = ref(new Date());
  const cursor = ref('grab');
  const texts = ref<TextBox[]>([]);
  const context = computed(() =>
    canvas.value ? canvas.value.getContext("2d") : null
  );
  const canvasZoomRatio = ref(1.0);
  const canvasRect = computed(() => ({
    x: container.value?.clientWidth || 0,
    y: (container.value?.clientWidth || 0) * aspectRatio.value,
  }));

  function reloadImage() {
    lastReload.value = new Date();
  }

  const image = computed(() => {
    const d = lastReload.value;

    if (typeof observationId !== "number" || typeof projectId !== "number") {
      throw new Error("Props are not defined correctly");
    }

    const bg = new Image();
    bg.src =
      `/api/projects/${projectId}/observations/${observationId}/image?v=${d.getTime()}`;
    bg.addEventListener("load", () => {
      if (canvas.value && context.value) {
        aspectRatio.value = bg.height / bg.width;
        // canvasZoomRatio.value = canvasRect.value.x / bg.width;
        canvasZoomRatio.value = canvas.value.width / bg.width;
        zoom.value = 1.0;
        console.info("image loaded event:", {
          zoom: zoom.value,
          aspectRatio: aspectRatio.value,
        });
        window.requestAnimationFrame(() => {
          drawImage();
          drawSquares();
          drawLines();
          drawTexts(zoom.value);
        });
        mode.value = EditorMode.GRAB; // initial editor mode
      }
    });

    return bg;
  });

  function forceHighQualityCanvas(onLoaded: () => Promise<void>) {
    if (typeof observationId !== "number" || typeof projectId !== "number") {
      throw new Error("Props are not defined correctly");
      // TODO: report error
    } else if (!context.value || !image.value) {
      throw new Error(
        "Image cannot be drawn as context or image is not fully loaded",
      );
      // TODO: report error
    } else if (!canvas.value) {
      throw new Error("Canvas is not available");
      // TODO: report error
    }

    isSaving.value = true;
    const targetWidth = image.value.width;
    const targetHeight = image.value.height;
    const initialCanvasWidth = canvas.value.width;
    const initialCanvasHeight = canvas.value.height;
    container.value?.setAttribute("width", "" + targetWidth);
    container.value?.setAttribute("height", "" + targetHeight);
    canvas.value?.setAttribute("width", "" + targetWidth);
    canvas.value?.setAttribute("height", "" + targetHeight);

    window.requestAnimationFrame(() => {
      const bg = new Image();
      bg.src =
        `/api/projects/${projectId}/observations/${observationId}/image?v=${new Date()}`;
      bg.addEventListener("load", () => {
        if (canvas.value && context.value) {
          aspectRatio.value = bg.height / bg.width;

          // alculate zoom based on canvasWidth and imageWith
          zoom.value = bg.width / initialCanvasWidth;
          clearCanvas();
          context.value.drawImage(bg, 0, 0, targetWidth, targetHeight);
          window.requestAnimationFrame(async () => {
            if (!context.value) {
              throw new Error(
                "Image cannot be drawn as context or image is not fully loaded",
              );
            }
            drawSquares();
            drawLines();
            drawTexts(zoom.value);
            await onLoaded();
            isSaving.value = false;

            canvas.value?.setAttribute("width", "" + initialCanvasWidth);
            canvas.value?.setAttribute("height", "" + initialCanvasHeight);
          });
        }
      });
    });
  }

  function drawImage() {
    if (!context.value || !image.value) {
      throw new Error(
        "Image cannot be drawn as context or image is not fully loaded",
      );
      // TODO: report error
    }

    const { x: zoomedX, y: zoomedY } = scale(canvasRect.value, zoom.value);

    context.value.drawImage(image.value, cameraPosition.value[0], cameraPosition.value[1], zoomedX, zoomedY);
  }

  const action = computed(() => actions[mode.value]);
  const actions: ImageEditorActionConfig = {
    [EditorMode.GRAB]: {
      icon: "i-mdi-hand-right",
      onActionPicked: () => {
        grabbed.value = undefined
        grabbing.value = false;
        cursor.value = 'grab'
      },
      mouseEvents: {
        up: (ev) => {
          if (grabbing.value) {
            grabbing.value = false;
            cursor.value = 'grab'
            draw();
          }
        },
        down: (ev) => {
          if (!grabbing.value) {
            const { x, y, w, h } = mouseRect(ev, beginX.value, beginY.value, zoom.value);
            beginX.value = x; // WORKS
            beginY.value = y; // WORKS
            grabbed.value = {
              x: x + w - cameraPosition.value[0], // WORKS
              y: y + h - cameraPosition.value[1] // WORKS
            };
            grabbing.value = true;
            cursor.value = 'grabbing'
            draw();
          }
        },
        move: (ev) => {
          if (grabbing.value && grabbed.value) {
            let { x, y } = mousePosition(ev);
            x = (x - grabbed.value.x); // WORKS
            y = (y - grabbed.value.y); // WORKS
            const move: [number, number] = [x, y];
            cameraPosition.value = move;
            draw();
          }
        },
      },
    },
    [EditorMode.LINE]: {
      icon: 'i-mdi-vector-line',
      onActionPicked: () => {
        cursor.value = 'crosshair';
      },
      mouseEvents: {
        up: () => {
          if (dragging.value) {
            dragging.value = false;
            if (!draftLine.value) {
              throw new Error('Draft line is not set!')
            }
            lines.value.push(draftLine.value);
            draftLine.value = undefined;
          }
        },
        down: (ev) => {
          if (!dragging.value) {
            const { x, y } = mousePosition(ev);
            beginX.value = x;
            beginY.value = y;
            dragging.value = true;
          }
        },
        move: (ev) => {
          if (dragging.value) {
            const square = mouseRect(ev, beginX.value, beginY.value, zoom.value);
            draftLine.value = {
              x: square.x - cameraPosition.value[0],
              y: square.y - cameraPosition.value[1],
              w: square.w,
              h: square.h,
              color: frontColor.value,
              z: zoom.value,
              width: lineWidth.value,
            };
            draw();
          }
        },
      },
    },
    [EditorMode.RECT]: {
      icon: "i-mdi-crop-square",
      onActionPicked: () => {
        dragging.value = false;
        cursor.value = 'crosshair';
      },
      mouseEvents: {
        up: (ev) => {
          if (dragging.value) {
            const square = mouseRect(ev, beginX.value, beginY.value, zoom.value);
            square.x -= cameraPosition.value[0]; // WORKS
            square.y -= cameraPosition.value[1]; // WORKS
            squares.value.push(square);
            dragging.value = false;
            draw();
          }
        },
        down: (ev) => {
          if (!dragging.value) {
            const { x, y } = mousePosition(ev);
            beginX.value = x;
            beginY.value = y;
            dragging.value = true;
          }
        },
        move: (ev) => {
          if (dragging.value) {
            const square = applyZoom(mouseRect(ev, beginX.value, beginY.value, zoom.value), zoom.value);
            clearCanvas();
            drawImage();
            drawSquare(square); // TODO: move inside drawSquares
            drawSquares();
            drawLines();
            drawTexts(zoom.value);
          }
        },
      },
    },
    [EditorMode.TEXT]: {
      icon: "i-mdi-format-text",
      onActionPicked: () => {
        if (writing.value) {
          cursor.value = 'crosshair'
        } else {
          cursor.value = 'text';
        }
        dragging.value = false;
      },
      mouseEvents: {
        up: (ev) => {
          // if already writing, move text instead of creating new
          dragging.value = false;
          if (writing.value){
            draw();
            // focus text field after creating text draft data
            window.requestAnimationFrame(() => (textInput.value as any)?.input?.focus());
          } else {
            draw();
          }
        },
        down: (ev) => {
          if (!writing.value) {
            textDraft.value = '';
            writing.value = true;
            dragging.value = true;
            const { x, y } = mousePosition(ev);
            draftTextPosition.value = [
              (x - cameraPosition.value[0]) / zoom.value,
              (y - cameraPosition.value[1]) / zoom.value
            ]; // works well!

            // change crosshair to indicate that we can move text
            cursor.value = 'crosshair'

            // NOTE: resize to default textsize triggers canvas rerender
            textSize.value = fontSizes.value[3].value;

            draw();
          } else if (writing.value) {
            dragging.value = true;
          }
        },
        move: (ev) => {
          if (dragging.value){
            const { x, y } = mousePosition(ev);
            draftTextPosition.value = [
              (x - cameraPosition.value[0]) / zoom.value,
              (y - cameraPosition.value[1]) / zoom.value
            ]; // works well!
            draw();
          }
        },
      },
      keyEvents: {
        down: (key: string) => {
          if (key === 'Enter') {
            saveTextDraft()
          }
        },
        up: () => {}
      }
    },
    [EditorMode.DISABLED]: {
      icon: '',
      onActionPicked: () => {
        cursor.value = 'progress';
      },
      mouseEvents: {
        up: () => {},
        down: () => {},
        move: () => {},
      },
    },
  };

  function clearCanvas() {
    const cvs = canvas.value;
    const ctx = context.value;
    if (!ctx || !cvs) {
      console.warn(
        "Skipping clearCanvas() due to bad/missing props and/or state",
      );
      return;
    }

    ctx.clearRect(0, 0, cvs.width, cvs.height);
  }


  function drawSquare(
    square: Square,
  ) {
    const ctx = context.value;
    if (!ctx) return;
    ctx.fillStyle = backColor.value;

    // TODO: support boxes made from other direction
    const [x, y, w, h] = square;

    ctx.fillRect(x, y, w, h);
  }


  function drawSquares() {
    if (!context.value) {
      throw new Error("Context is not defined");
    }
    for (let i = 0; i < squares.value.length; i++) {
      const square = applyCamera(applyZoom(
        { ...squares.value[i] },
        zoom.value,
      ), cameraPosition.value);

      drawSquare(square);
    }
  }

  function drawLine(
    line: Line,

  ) {
    const ctx = context.value;
    if (!ctx) return;

    const { color, width } = line;

    const square = applyCamera(applyZoom(
      { ...line },
      zoom.value,
    ), cameraPosition.value);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(square[0], square[1]);
    ctx.lineTo(
      square[0] + square[2],
      square[1] + square[3]
    );
    ctx.stroke();
    ctx.closePath();
  }

  function drawLines() {
    if (!context.value) {
      throw new Error("Context is not defined");
    }

    if (draftLine.value) {
      drawLine(draftLine.value);
    }

    for (let i = 0; i < lines.value.length; i++) {
      drawLine(lines.value[i]);
    }
  }


  // TODO: improve documentation
  function drawText(
    text: TextBox,
  ) {
    const ctx = context.value;
    if (!ctx) {
      throw new Error('Context is not defined when trying to draw texts')
    };
    ctx.fillStyle = text.color;
    const z = text.zoom;
    const fontSize = Math.round(text.size * z);
    let scaledPos = {
      x: (text.position[0]) * z, // works
      y: (text.position[1]) * z // works
    }

    const fixedPos = {
      x: (scaledPos.x + cameraPosition.value[0]), // works
      y: (scaledPos.y + cameraPosition.value[1]) // works
    }

    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(text.text, fixedPos.x, fixedPos.y); 
  }

  // TODO: improve documentation
  function drawTexts(canvasZoom: number) {
    if (!context.value) {
      throw new Error("Context is not defined");
    }

    // draw draft if present
    if (draftTextPosition.value && textDraft.value) {
      drawText({
        color: frontColor.value,
        position: draftTextPosition.value,
        size: textSize.value,
        text: textDraft.value,
        zoom: canvasZoom,
      });
    } else if (draftTextPosition.value && !textDraft.value) {
      drawText({
        color: "#dddddd99",
        position: draftTextPosition.value,
        size: textSize.value,
        text: 'Enter text',
        zoom: canvasZoom,
      });
    }

    for (let i = 0; i < texts.value.length; i++) {
      const text = texts.value[i];
      drawText({
        ...text,
        zoom: canvasZoom,
      });
    }
  }


  function onMouseDown(ev: MouseEvent) {
    return action.value.mouseEvents.down(ev);
  }

  function onMouseUp(ev: MouseEvent) {
    return action.value.mouseEvents.up(ev);
  }
  function onMouseMove(ev: MouseEvent) {
    return action.value.mouseEvents.move(ev);
  }
  function onKeyDown(ev: KeyboardEvent) {
    // check if enter
    const code = ev.key;
    return action.value.keyEvents?.down(code);
  }
  function onKeyUp(ev: KeyboardEvent) {
    // check if enter
    const code = ev.key;
    return action.value.keyEvents?.up(code);
  }

  function reset() {
    if (
      canvas.value &&
      context.value
    ) {
      clearCanvas();
      canvas.value.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.value.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("keydown", onKeyDown, true);
      canvas.value.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      canvas.value.addEventListener("mousemove", onMouseMove);
      window.addEventListener("keyup", onKeyUp, true);
      window.addEventListener("keydown", onKeyDown, true);
      squares.value = [];
      lines.value = [];
      texts.value = [];
      dragging.value = false;
      grabbing.value = false;
      writing.value = false;
      textDraft.value = '';
      drawImage();
    } else {
      throw new Error("Canvas or canvas context is not defined!");
    }
  }

  function createImageFile(
    onDone: (file: File) => void | Promise<void>,
  ): void {
    const cvs = canvas.value;
    if (!cvs) {
      throw new Error(
        "Canvas is not support. Your browser might need to be updated",
      );
    }

    resetZoom();

    // TODO: reset boundaries as well? while full screen overlay?
    // reset zoom so image capture can do its job
    forceHighQualityCanvas(() => new Promise((resolve, reject) => {
      const cvs = canvas.value;
      if (!cvs) {
        return reject(
          new Error(
            "Canvas is not support. Your browser might need to be updated",
          ),
        );
      }

      cvs.toBlob(
        async (blob) => {
          if (!projectId || !observationId) {
            return reject(new Error("Project or observation is not defined"));
          } else if (blob == null) {
            return reject(
              new Error("Image data could not be extracted from canvas"),
            );
          }

          const file = new File([blob], "image.jpg", {
            type: "image/jpeg",
            lastModified: 0,
          });
          await onDone(file);

          clearCanvas();
          reloadImage();
          reset();
          resolve();
        },
        "image/jpeg",
        1,
      );
    }));
  }

  function zoomIn() {
    zoom.value = Math.min(10, zoom.value + ZOOM_STEP);
    clearCanvas();
    drawImage();
    drawSquares();
    drawTexts(zoom.value);
    drawLines();
  }

  function zoomOut() {
    zoom.value = Math.max(0.01, zoom.value - ZOOM_STEP);
    clearCanvas();
    drawImage();
    drawSquares();
    drawTexts(zoom.value);
    drawLines();
  }

  function resetZoom() {
    zoom.value = 1.0;
    cameraPosition.value = [0, 0];
    grabbed.value = undefined;
    grabbing.value = false;
    clearCanvas();
    drawImage();
    drawSquares();
    drawTexts(zoom.value);
    drawLines();
  }

  function destroyEditor() {
    if (canvas.value) {
      canvas.value.removeEventListener("mousedown", onMouseDown);
      canvas.value.removeEventListener("mouseup", onMouseUp);
      canvas.value.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    }
  }

  function setTextDraft(text: string) {
    textDraft.value = text;
  }

  async function saveTextDraft(): Promise<void> {
    if (!draftTextPosition.value) {
      // TODO: report error
      console.warn('Cannot save text draft when it has no position');
      return;
    }
    if (!textDraft.value) {
      // TODO: handle better
      console.warn('Cannot save text draft is empty');
      return;
    }
    const newText: TextBox = {
      color: frontColor.value,
      position: draftTextPosition.value,
      size: textSize.value,
      text: textDraft.value,
      zoom: zoom.value,
    }

    texts.value.push(newText);
    textDraft.value = '';
    draftTextPosition.value = undefined;
    writing.value = false;

    clearCanvas();
    drawImage();
    drawSquares();
    drawLines();
    drawTexts(zoom.value);
    cursor.value = 'text';
  }

  function modeActive(_mode: EditorMode): boolean {
    return mode.value == _mode;
  }

  function setMode(_mode: EditorMode): void {
    mode.value = _mode;
  }

  const fontSizes = ref([12, 14, 18, 24, 38, 52, 66, 82].map((v) => ({
    value: v,
    label: `${v}px`,
  })))

  const lineWidths = ref([2, 3, 5, 8, 13, 21].map((v) => ({
    value: v,
    label: `${v}px`,
  })));

  return {
    cursor,
    actions,
    zoom,
    hasPendingChanges,
    reset,
    canvasRect,
    createImageFile,
    zoomIn,
    zoomOut,
    resetZoom,
    destroyEditor,
    isSaving,
    textDraft,
    setTextDraft,
    saveTextDraft,
    writing,
    modeActive,
    setMode,
    textSize,
    fontSizes,
    lineWidths,
    lineWidth,
  };
}
