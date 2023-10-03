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
  const boxes = ref<Box[]>([]);
  const draftLine = ref<Line>();
  const lines = ref<Line[]>([]);
  const dragging = ref(false);
  const grabbing = ref(false);
  const draftTextPosition = ref<[number, number] | undefined>();
  const grabbed = ref<{ x: number; y: number } | undefined>()
  const writing = ref<boolean>(false);
  const textDraft = ref<string>('');
  const textSize = ref<number>(24);
  const textDraftSolidBg = ref<boolean>(true);
  const textDraftBgPadding = ref<number>(14);
  const lineWidth = ref<number>(5);
  const cameraPosition = ref<[number, number]>([0, 0]);
  const hasPendingChanges = computed(() => boxes.value.length > 0 || texts.value.length > 0 || lines.value.length > 0);

  function draw() {
    // wipe and redraw
    clearCanvas();
    drawImage();
    drawBoxes();
    drawLines();
    drawTexts(zoom.value);
  }

  // redraw the whole thing when ui stuff changes
  watch([textDraftSolidBg, textDraftBgPadding, textSize, textDraft, frontColor, backColor], () => {
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
          drawBoxes();
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
            drawBoxes();
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
            boxes.value.push({ ...square, fillColor: backColor.value });
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
            const [x, y, w, h] = square;
            clearCanvas();
            drawImage();
            drawBoxes();
            drawBox({ x, y, w, h, fillColor: backColor.value, z: zoom.value }); // TODO: move inside drawSquares
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
          if (writing.value && dragging.value) {
            // // focus text field after creating text draft data
            window.requestAnimationFrame(() => (textInput.value as any)?.input?.focus());
          }

          dragging.value = false;
          draw();

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
          // NOTE: too aggresive
          // if (key === 'Enter') {
          //   saveTextDraft()
          // }
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


  function drawBox(
    box: Box,
  ) {
    const ctx = context.value;
    if (!ctx) return;
    ctx.fillStyle = backColor.value;

    // TODO: support boxes made from other direction
    const { x, y, w, h, fillColor } = box;

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
  }


  function drawBoxes() {
    if (!context.value) {
      throw new Error("Context is not defined");
    }
    for (let i = 0; i < boxes.value.length; i++) {
      const square = applyCamera(applyZoom(
        { ...boxes.value[i] },
        zoom.value,
      ), cameraPosition.value);

      const [x, y, w, h] = square;
      const { fillColor, z } = boxes.value[i];
      drawBox({ x, y, w, h, fillColor, z });
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
  
    // TODO: simplify
    const lines = text.text.split('\n');
    if (!lines.length) {
      return;
    }
  
    const z = text.zoom;
    const fontSize = Math.floor(text.size * z);
    let scaledPos = {
      x: (text.position[0]) * z, // works
      y: (text.position[1]) * z // works
    }

    const fixedPos = {
      x: (scaledPos.x + cameraPosition.value[0]), // works
      y: (scaledPos.y + cameraPosition.value[1]) // works
    }

    // set the font family
    // TODO: support multiple font families
    ctx.font = `${fontSize}px Arial`;
    const lineHeight = 1.15;

    // draw background square if enabled
    if (text.bgcolor) {
      // const width = ctx.measureText(text.text);
      let height;
      if (ctx.font) {
        height = parseInt(ctx.font.match(/\d+/)?.pop() as any);
        if (isNaN(height)) {
          // TODO: report
          console.warn('Unable to read font size from canvas context.');
          return;
        }
      } else {
        // TODO: report
        console.warn('Context font not set - cannot determine height of text background box. Will skip');
        return;
      }

      const pad = text.padding;
      const pad2 = pad + pad;
      const halfHeight = height / 2;

      ctx.fillStyle = text.bgcolor;
      const longestText: TextMetrics = lines.map(
        line => ctx.measureText(line)
      ).sort((a: TextMetrics, b: TextMetrics) => {
        if (a.width === b.width) return 0;
        return a.width < b.width ? 1 : -1;
      })[0];

      // draw the background for the height of all lines
      for (let i = 0; i < lines.length; i++) {
        ctx.fillRect(
          fixedPos.x - pad,
          fixedPos.y - halfHeight - pad - 2 + i * fontSize * lineHeight,
          longestText.width + pad2,
          height - halfHeight + pad2 + 1,
        )
      }
    }

    // draw the text lines on top of optional background
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = text.color;
      ctx.fillText(lines[i], fixedPos.x, fixedPos.y + i * fontSize * lineHeight); 
    }
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
        bgcolor: backColor.value,
        padding: textDraftBgPadding.value,
      });
    } else if (draftTextPosition.value && !textDraft.value) {
      drawText({
        color: "#dddddd99",
        position: draftTextPosition.value,
        size: textSize.value,
        text: 'Enter text',
        zoom: canvasZoom,
        bgcolor: backColor.value,
        padding: textDraftBgPadding.value,
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
      boxes.value = [];
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
    drawBoxes();
    drawTexts(zoom.value);
    drawLines();
  }

  function zoomOut() {
    zoom.value = Math.max(0.01, zoom.value - ZOOM_STEP);
    clearCanvas();
    drawImage();
    drawBoxes();
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
    drawBoxes();
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

  function setTextDraftSolidBg(bool: boolean) {
    textDraftSolidBg.value = bool;
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
      bgcolor: backColor.value,
      padding: textDraftBgPadding.value,
    }

    texts.value.push(newText);
    textDraft.value = '';
    draftTextPosition.value = undefined;
    writing.value = false;

    clearCanvas();
    drawImage();
    drawBoxes();
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
    actions,
    canvasRect,
    createImageFile,
    cursor,
    destroyEditor,
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
  };
}
