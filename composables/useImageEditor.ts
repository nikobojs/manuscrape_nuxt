import { EditorMode, ImageEditorActionConfig, adjustCameraToZoom, applyCamera, applyZoom, mousePosition, mouseRect, scale } from "~/utils/imageEditor";

let _imageChangeId = 0;
const imageChangeId = () => _imageChangeId++;
const maxZoom = 10;   // 1000%
const minZoom = 0.1; // 10%

const fontSizes = [12, 14, 18, 24, 30, 38, 45, 52, 64, 76, 88, 96].map((v) => ({
  value: v,
  label: `${v}px`,
}));

const lineWidths = [2, 3, 5, 8, 13, 21].map((v) => ({
  value: v,
  label: `${v}px`,
}));

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
  const changes = ref<ImageChanges>([]);
  const draftTextPosition = ref<[number, number] | undefined>();
  const grabbed = ref<{ x: number; y: number } | undefined>()
  const writing = ref<boolean>(false);
  const shiftKeyDown = ref<boolean>(false);
  const controlKeyDown = ref<boolean>(false);
  const textDraft = ref<string>('');
  const textSize = ref<number>(45);
  const textDraftSolidBg = ref<boolean>(true);
  const draftTextMinRect = ref<{ x: number; y: number }>({x: 0, y: 0});
  const lineWidth = ref<number>(5);
  const cameraPosition = ref<[number, number]>([0, 0]);
  const hasPendingChanges = computed(() => boxes.value.length > 0 || texts.value.length > 0 || lines.value.length > 0);
  const { report } = useSentry();

  function draw() {
    // wipe and redraw
    clearCanvas();
    drawImage();
    drawBoxes();
    drawTexts(zoom.value);
    drawLines();
  }

  // redraw the whole thing when ui stuff changes
  watch([textDraftSolidBg, textSize, textDraft, frontColor, backColor], () => {
    draw();
  });

  // focus text area after changing settings while writing
  watch([textSize, frontColor, backColor], () => {
    if (writing.value) {
      focusTextArea();
    }
  });

  const mode = ref<EditorMode>(EditorMode.DISABLED);
  const previousMode = ref<EditorMode | undefined>();
  const lastReload = ref(new Date());
  const cursor = ref('grab');
  const texts = ref<TextBox[]>([]);
  const context = computed(() =>
    canvas.value ? canvas.value.getContext("2d") : null
  );
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
        resetZoom();
        resetPosition();
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
    } else if (!context.value || !image.value) {
      throw new Error(
        "Image cannot be drawn as context or image is not fully loaded",
      );
    } else if (!canvas.value) {
      throw new Error("Canvas is not available");
    }

    isSaving.value = true;
    zoom.value = 1.0;
    cameraPosition.value = [0, 0];
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

          zoom.value = 1;
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

            canvas.value?.setAttribute("width", "" + initialCanvasWidth);
            canvas.value?.setAttribute("height", "" + initialCanvasHeight);
          });
        }
      });
    });
  }

  function drawImage(resizeToFit = false) {
    if (!context.value || !image.value) {
      throw new Error(
        "Image cannot be drawn as context or image is not fully loaded",
      );
    }

    // TODO: deprecate canvasRect variable
    const imageSize = resizeToFit
      ? canvasRect.value
      : {
        x: image.value.width,
        y: image.value.height
      };

    const { x: zoomedX, y: zoomedY } = scale(imageSize, zoom.value);

    context.value.drawImage(image.value, cameraPosition.value[0], cameraPosition.value[1], zoomedX, zoomedY);
  }

  function registerImageUpdate (
    type: ImageChangeType,
    id: number,
    component: TextBox | Line | Box,
  ) {
    // delete all unapplied changes (redo's)
    changes.value = changes.value.filter((c) => c.applied);

    // save new change
    changes.value.push({
      type,
      id,
      applied: true,
      component
    });
  }

  const action = computed(() => actions[mode.value]);
  const actions: ImageEditorActionConfig = {
    [EditorMode.GRAB]: {
      menuIndex: 0,
      cursor: 'grab',
      icon: "i-mdi-hand-right",
      onActionPicked: () => {
        grabbed.value = undefined
        grabbing.value = false;
        cursor.value = 'grab'
      },
      mouseEvents: {
        up: (_ev) => {
          if (grabbing.value) {
            grabbing.value = false;
            cursor.value = 'grab'
            draw();
          }
        },
        down: (ev) => {
          if (!grabbing.value && canvas.value) {
            const { x, y, w, h } = mouseRect(ev, canvas.value, beginX.value, beginY.value, zoom.value);
            beginX.value = x;
            beginY.value = y;

            // TODO: use some vector math helper func for grabbed x y
            grabbed.value = {
              x: x + w - cameraPosition.value[0],
              y: y + h - cameraPosition.value[1]
            };
            grabbing.value = true;
            cursor.value = 'grabbing'
            draw();
          }
        },
        move: (ev) => {
          if (grabbing.value && grabbed.value && canvas.value) {
            let { x, y } = mousePosition(ev, canvas.value);
            // TODO: use some vector math helper func for x and y
            x = (x - grabbed.value.x);
            y = (y - grabbed.value.y);
            const move: [number, number] = [x, y];
            cameraPosition.value = move;
            draw();
          }
        },
        rightDown: (ev) => {
          actions[EditorMode.GRAB].mouseEvents.down?.(ev);
        },
        rightUp: (ev) => {
          actions[EditorMode.GRAB].mouseEvents.up?.(ev);
        }
      },
    },
    [EditorMode.LINE]: {
      menuIndex: 3,
      cursor: 'crosshair',
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

            registerImageUpdate('line', draftLine.value.id, draftLine.value);
            lines.value.push(draftLine.value);
            draftLine.value = undefined;
          }
        },
        down: (ev) => {
          if (!dragging.value && canvas.value) {
            const { x, y } = mousePosition(ev, canvas.value);
            beginX.value = x;
            beginY.value = y;
            dragging.value = true;
          }
        },
        move: (ev) => {
          if (dragging.value && canvas.value) {
            const square = mouseRect(ev, canvas.value, beginX.value, beginY.value, zoom.value);
            // TODO: use some vector math helper func for x and y
            draftLine.value = {
              x: square.x - cameraPosition.value[0],
              y: square.y - cameraPosition.value[1],
              w: square.w,
              h: square.h,
              color: frontColor.value,
              z: zoom.value,
              width: lineWidth.value,
              id: imageChangeId(),
            };
            draw();
          }
        },
      },
    },
    [EditorMode.RECT]: {
      menuIndex: 2,
      cursor: 'crosshair',
      icon: "i-mdi-crop-square",
      onActionPicked: () => {
        dragging.value = false;
        cursor.value = 'crosshair';
      },
      mouseEvents: {
        up: (ev) => {
          if (dragging.value && canvas.value) {
            const square = mouseRect(ev, canvas.value, beginX.value, beginY.value, zoom.value);
            // TODO: use some vector math helper func
            square.x -= cameraPosition.value[0]; // WORKS
            square.y -= cameraPosition.value[1]; // WORKS

            const changeId = imageChangeId();

            const box: Box = {
              ...square,
              fillColor:
              backColor.value,
              id: changeId,
            }

            registerImageUpdate('box', changeId, box);

            boxes.value.push(box);
            dragging.value = false;
            draw();
          }
        },
        down: (ev) => {
          if (!dragging.value && canvas.value) {
            const { x, y } = mousePosition(ev, canvas.value);
            beginX.value = x;
            beginY.value = y;
            dragging.value = true;
          }
        },
        move: (ev) => {
          if (dragging.value && canvas.value) {
            const square = applyZoom(mouseRect(ev, canvas.value, beginX.value, beginY.value, zoom.value), zoom.value);
            const [x, y, w, h] = square;
            clearCanvas();
            drawImage();
            drawBoxes();
            drawBox({ x, y, w, h, fillColor: backColor.value, z: zoom.value, id: 0 }); // TODO: move inside drawSquares
            drawLines();
            drawTexts(zoom.value);
          }
        },
      },
    },
    [EditorMode.TEXT]: {
      menuIndex: 1,
      cursor: 'text',
      icon: "i-mdi-format-text",
      onActionPicked: () => {
        cursor.value = 'crosshair';
        dragging.value = false;
      },
      mouseEvents: {
        up: (ev) => {
          if (!canvas.value) return;
          // if already writing, move text instead of creating new
          if (writing.value && dragging.value) {
            // pass (TODO)
          } else if (!writing.value && dragging.value) {
            const square = applyZoom(mouseRect(ev, canvas.value, beginX.value, beginY.value, zoom.value), zoom.value);
            writing.value = true;
            textDraft.value = '';
            cursor.value = 'move';

            if (square[2] < 0) {
              square[0] = beginX.value + square[2];
              square[2] = Math.abs(square[2]);
            }
            if (square[3] < 0) {
              square[1] = beginY.value + square[3];
              square[3] = Math.abs(square[3]);
            }

            draftTextMinRect.value = {
              x: square[2] / zoom.value,
              y: square[3] / zoom.value,
            };

            draftTextPosition.value = [
              (square[0] - cameraPosition.value[0]) / zoom.value,
              (square[1] - cameraPosition.value[1]) / zoom.value
            ];

            focusTextArea();
          }

          dragging.value = false;
          draw();
        },
        down: (ev) => {
          if (!canvas.value) return;
          dragging.value = true;

          // in any case we cant to use the position clicked on
          const { x, y } = mousePosition(ev, canvas.value);

          // set beginX and beginY for drawing rect
          beginX.value = x;
          beginY.value = y;
        },
        move: (ev) => {
          if (dragging.value && canvas.value && writing.value){
            const { x, y } = mousePosition(ev, canvas.value);
            // TODO: use some vector math helper func
            draftTextPosition.value = [
              (x - cameraPosition.value[0]) / zoom.value,
              (y - cameraPosition.value[1]) / zoom.value
            ];
            draw();
          } else if (dragging.value && canvas.value && !writing.value) {
            const square = applyZoom(mouseRect(ev, canvas.value, beginX.value, beginY.value, zoom.value), zoom.value);
            const [x, y, w, h] = square;
            clearCanvas();
            drawImage();
            drawBoxes();
            drawBox({ x, y, w, h, fillColor: backColor.value, z: zoom.value, id: 0 }); // TODO: move inside drawSquares
            drawLines();
            drawTexts(zoom.value);
          }
        },
        rightUp: (ev) => {
          if (writing.value) {
            focusTextArea();
          }
        }
      },
      keyEvents: {
        down: (key: string) => {
          // save text on ctrl+enter
          if (key === 'Enter' && controlKeyDown.value) {
            saveTextDraft();
          } else if (key === 'Escape') {
            resetTextDraft();
          }
        },
      }
    },
    [EditorMode.DISABLED]: {
      cursor: 'progress',
      icon: '',
      onActionPicked: () => {
        cursor.value = 'progress';
      },
      mouseEvents: {},
    },
  };

  async function focusTextArea() {
    // TODO: fix type mistake somewhere
    window.requestAnimationFrame(() => {
      (textInput.value as any)?.textarea?.focus();
    });
  }

  function clearCanvas() {
    const cvs = canvas.value;
    const ctx = context.value;
    if (!ctx || !cvs) {
      console.warn(
        "Skipping clearCanvas() due to bad/missing props and/or state",
        { ctx, cvs },
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
      const { fillColor, z, id } = boxes.value[i];
      drawBox({ x, y, w, h, fillColor, z, id });
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

    // draw all unsaved lines
    for (let i = 0; i < lines.value.length; i++) {
      drawLine(lines.value[i]);
    }

    // draw draft line if there is any
    if (draftLine.value) {
      drawLine(draftLine.value);
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
    const relativeZoom = z;
    const fontSize = Math.round(text.size * relativeZoom);
    let padding = 0;
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

    // TODO: support different line heights
    const lineHeight = 1.10 * fontSize;

    let fontHeight;
    if (ctx.font) {
      fontHeight = parseInt(ctx.font.match(/\d+/)?.pop() as any);
      if (isNaN(fontHeight)) {
        const warn = 'Unable to read font size from canvas context.';
        report('warning', warn);
        return;
      }
    } else {
      const warn = 'Context font not set - cannot determine height of text background box. Will skip';
      report('warning', warn)
      return;
    }

    // draw background square if enabled
    if (text.bgcolor) {
      padding = 8 * relativeZoom; // give text padding if its inside a box

      ctx.fillStyle = text.bgcolor;
      const longestText: TextMetrics = lines.map(
        line => ctx.measureText(line)
      ).sort((a: TextMetrics, b: TextMetrics) => {
        if (a.width === b.width) return 0;
        return a.width < b.width ? 1 : -1;
      })[0];

      const x = fixedPos.x;
      const y = fixedPos.y;
      const w = Math.max(text.minWidth * z, longestText.width + fontSize);
      const h = Math.max(text.minHeight * z, (lines.length + 0.6) * lineHeight);
      const square: Square = [ x, y, w, h ]

      // draw the background for the height of all lines
      ctx.fillRect(...square);
    }

    // draw the text lines on top of optional background
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = text.color;
      ctx.fillText(
        lines[i],
        fixedPos.x + fontSize / 2,
        fixedPos.y + (i + 1.1) * lineHeight,
      ); 
    }
  }

  // TODO: improve function name
  function drawTexts(canvasZoom: number) {
    if (!context.value) {
      throw new Error("Context is not defined");
    }

    // draw all existing unsaved texts
    for (let i = 0; i < texts.value.length; i++) {
      const textbox = texts.value[i];
      drawText({
        ...textbox,
        zoom: canvasZoom,
      });
    }

    // draw draft text if present (on top of the other texts)
    if (draftTextPosition.value) {
      const text = textDraft.value || 'Enter text';
      drawText({
        color: frontColor.value,
        position: draftTextPosition.value,
        size: textSize.value,
        text: text,
        zoom: canvasZoom,
        bgcolor: textDraftSolidBg.value ? backColor.value : undefined,
        id: 0,
        minHeight: draftTextMinRect.value.y,
        minWidth: draftTextMinRect.value.x,
      });
  } }


  function onMouseDown(ev: MouseEvent) {
    if (ev.button === 2 || ev.which === 3) {
      activateTempGrab(true, ev);
      return action.value.mouseEvents.rightDown?.(ev);
    } else if (ev.button === 0 || ev.which === 1) {
      return action.value.mouseEvents.down?.(ev);
    }
  }

  function onMouseUp(ev: MouseEvent) {
    if (ev.button === 2 || ev.which === 3) {
      deactivateTempGrab();
      return action.value.mouseEvents.rightUp?.(ev);
    } else if (ev.button === 0 || ev.which === 1) {
      return action.value.mouseEvents.up?.(ev);
    }
  }

  function onMouseMove(ev: MouseEvent) {
    return action.value.mouseEvents.move?.(ev);
  }


  function onKeyDown(ev: KeyboardEvent) {
    // check if enter
    const code = ev.key;

    // activate control and shift booleans
    if (code === 'Control' && !controlKeyDown.value) {
      controlKeyDown.value = true;
    } else if (code === 'Shift' && !shiftKeyDown.value) {
      shiftKeyDown.value = true;
    }

    // if not writing, use all these shortcuts
    if (!writing.value) {
      if (shiftKeyDown.value && code === 'W') {
        cameraPosition.value[1] += 10;
        draw();
      } else if (shiftKeyDown.value && code === 'S') {
        cameraPosition.value[1] -= 10;
        draw();
      } else if (shiftKeyDown.value && code === 'A') {
        cameraPosition.value[0] += 10;
        draw();
      } else if (shiftKeyDown.value && code === 'D') {
        cameraPosition.value[0] -= 10;
        draw();
      } else if (code === 'q') {
        mode.value = EditorMode.GRAB;
        action.value?.onActionPicked();
      } else if (code === 'w') {
        mode.value = EditorMode.TEXT;
        action.value?.onActionPicked();
      } else if (code === 'e') {
        mode.value = EditorMode.RECT;
        action.value?.onActionPicked();
      } else if (code === 'r') {
        mode.value = EditorMode.LINE;
        action.value?.onActionPicked();
      }
    }

    return action.value.keyEvents?.down?.(code);
  }


  function onKeyUp(ev: KeyboardEvent) {
    // check if enter
    const code = ev.key;

    if (code === 'Shift') {
      shiftKeyDown.value = false;
    } else if (code === 'Control') {
      controlKeyDown.value = false;
    }

    return action.value.keyEvents?.up?.(code);
  }

  function onScroll(ev: WheelEvent) {
    // if control key is down and target is canvas: zoom in or out
    if (shiftKeyDown.value && (ev.target as HTMLCanvasElement).tagName === 'CANVAS') {
      const { deltaY } = ev;
      const up = deltaY < 0;

      const at = mousePosition(ev, canvas.value)
      up ? addToZoom(ZOOM_STEP, at) : addToZoom(-ZOOM_STEP, at);

      // also call the actions if they want their own shortcut attached
      action.value.mouseEvents?.scroll?.(ev, up);
    } else if (!controlKeyDown.value && !shiftKeyDown.value) {
      console.log('scrolling!', ev)
    }
  }


  // Called on every rightClick down (contextmenu event)
  // NOTE: just prevents the context menu to show up
  function onRightClick(ev: MouseEvent) {
    ev.preventDefault();
  }

  // activates the temporary grab mode and saves the existing mode so it can be restored
  function activateTempGrab(startGrabbing = false, ev?: MouseEvent) {
    if (mode.value === EditorMode.GRAB) return;
    previousMode.value = mode.value;
    mode.value = EditorMode.GRAB;
    actions[EditorMode.GRAB].onActionPicked();
    if (startGrabbing && ev) {
        actions[EditorMode.GRAB].mouseEvents.down?.(ev);
    } else if(startGrabbing && !ev) {
      const warn = 'Will not activate GRAB mode, due to missing event in function arguments';
      report('warning', warn)
    }
  }

  // deactivates the temporary grab mode and restores the previous mode
  function deactivateTempGrab() {
    const nextMode = previousMode.value || EditorMode.GRAB;
    mode.value = nextMode;
    actions[nextMode].onActionPicked();
    grabbing.value = false;
    previousMode.value = undefined;

    // if they were writing, refocus the textarea
    if (writing.value) {
      focusTextArea();
    }
  }

  function reset() {
    if (
      canvas.value &&
      context.value
    ) {
      clearCanvas();
      removeEventListeners(); // fix: naming (it removes all eventlisteners)
      addEventListeners();
      boxes.value = [];
      lines.value = [];
      texts.value = [];
      changes.value = [];
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
          isSaving.value = false;
          resolve();
        },
        "image/jpeg",
        1,
      );
    }));
  }


  // // NOTE: 'at' is offsetX and offsetY mouse event inside canvas
  function addToZoom(val: number, at?: { x:number; y:number }): void {
    let newZoomVal = zoom.value + val;
    if (!at && canvas.value) {
      // TODO: use some vector helper
      at = {
        x: canvas.value.width / 2,
        y: canvas.value.height / 2,
      }
    } else if (!at) {
      throw new Error('Canvas and/or \'at\' is not defined');
    };

    // respect minimum zoom value
    if (newZoomVal < minZoom) {
      newZoomVal = minZoom;
    // respect maximum zoom value
    } else if (newZoomVal > maxZoom) {
      newZoomVal = maxZoom;
    }

    // redraw and adjust camera if zoom different than last time
    if (newZoomVal !== zoom.value) {
      cameraPosition.value = adjustCameraToZoom(zoom.value, at, cameraPosition.value, val > 0);
      zoom.value = newZoomVal;
      draw();
    }
  }

  function resetZoom() {
    if (!canvas.value) throw new Error('Canvas is not defined');

    if (image.value.width > canvas.value.width) {
      zoom.value = Math.floor((canvas.value.width / image.value.width) * 100) / 100;
    } else {
      zoom.value = 1.0;
    }

    grabbed.value = undefined;
    grabbing.value = false;
    resetPosition();
    draw();
  }

  function resetPosition() {
    if (image.value && canvas.value) {
      if (image.value.width < canvas.value.width) {
        const x = (canvas.value.width / 2) - (image.value.width / 2)
        cameraPosition.value[0] = x;
        cameraPosition.value[1] = 30;
      } else {
        cameraPosition.value[0] = 0;
        cameraPosition.value[1] = 0;
      }
    }
  }

  // TODO: refactor or improve naming
  function removeEventListeners() {
    if (canvas.value) {
      canvas.value.removeEventListener("mousedown", onMouseDown);
      canvas.value.removeEventListener("contextmenu", onRightClick);
    }

    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("wheel", onScroll, true);
  }

  function addEventListeners() {
    if (!canvas.value) {
      throw new Error('Unable to add event listeners to canvas, as it is not defined!');
    }

    canvas.value.removeEventListener("contextmenu", onRightClick);
    canvas.value.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("wheel", onScroll, true);
    canvas.value.addEventListener("contextmenu", onRightClick);
  }

  function setTextDraft(text: string) {
    textDraft.value = text;
  }

  function setTextDraftSolidBg(bool: boolean) {
    textDraftSolidBg.value = bool;
  }

  function resetTextDraft() {
    draftTextPosition.value = undefined;
    textDraft.value = '';
    writing.value = false;
    cursor.value = 'text';
    draw();
  }

  async function saveTextDraft(): Promise<void> {
    if (!draftTextPosition.value) {
      const warn = 'Cannot save text draft when it has no position';
      report('warning', warn);
      return;
    }
    if (!textDraft.value) {
      // TODO: handle better
      console.warn('Cannot save text draft is empty');
      return;
    }
    const changeId = imageChangeId();
    const newText: TextBox = {
      color: frontColor.value,
      position: draftTextPosition.value,
      size: textSize.value,
      text: textDraft.value,
      zoom: zoom.value,
      bgcolor: textDraftSolidBg.value ? backColor.value : undefined,
      id: changeId,
      minHeight: draftTextMinRect.value.y,
      minWidth: draftTextMinRect.value.x,
    }

    registerImageUpdate('text', changeId, newText);

    texts.value.push(newText);
    resetTextDraft();
  }

  function modeActive(_mode: EditorMode): boolean {
    return mode.value == _mode;
  }

  function setMode(_mode: EditorMode): void {
    mode.value = _mode;
  }

  function getTargetRefByImageChange(change: ImageChange) {
    return change.type === 'text'
      ? texts : change.type === 'box'
      ? boxes : lines;
  }

  function undo() {
    const newestApplied = changes.value.filter(c => c.applied).reverse()[0]
    newestApplied.applied = false;

    const target: Ref<{ id: number}[]> = getTargetRefByImageChange(newestApplied);
    if (!target.value?.length) {
      const warn = 'Undo target ref was empty or undefined';
      report('warning', warn);
      return;
    }

    target.value = target.value.filter((t) => t.id !== newestApplied.id);
    draw();
  }

  function redo() {
    const newestNonApplied = changes.value.filter(c => !c.applied)[0]
    newestNonApplied.applied = true;

    const target: Ref<{ id: number}[]> = getTargetRefByImageChange(newestNonApplied);
    if (!target.value) {
      const warn = 'Redo target ref was undefined';
      report('warning', warn);
      return;
    }

    target.value = target.value.concat([{ ...newestNonApplied.component }]);
    draw();
  }

  const undoDisabled = computed(() => changes.value.filter(c => c.applied).length === 0);
  const redoDisabled = computed(() => changes.value.filter(c => !c.applied).length === 0);

  const canvasBackgroundPosition = computed<string>(() =>
    `${cameraPosition.value[0]}px ${cameraPosition.value[1]}px`,
  );

  const canvasBackgroundSize = computed<string>(() => {
    const boxSize = 48;
    const px = boxSize * zoom.value;
    return `${px}px ${px}px`
  });

  const actionButtons = computed(() => {
    return Object.entries(actions)
      .filter(([k]) => k !== EditorMode.DISABLED.toString())
      .sort(([_k1, a], [_k2, b]) => (a?.menuIndex || 0) > (b?.menuIndex || 0) ? 1 : -1);
  });

  return {
    actionButtons,
    canvasRect,
    createImageFile,
    cursor,
    removeEventListeners,
    fontSizes,
    hasPendingChanges,
    isSaving,
    lineWidth,
    lineWidths,
    modeActive,
    redo,
    redoDisabled,
    reset,
    resetTextDraft,
    resetZoom,
    saveTextDraft,
    setMode,
    setTextDraft,
    setTextDraftSolidBg,
    textDraft,
    textDraftSolidBg,
    textSize,
    undo,
    undoDisabled,
    writing,
    zoom,
    addToZoom,
    canvasBackgroundPosition,
    canvasBackgroundSize,
  };
}
