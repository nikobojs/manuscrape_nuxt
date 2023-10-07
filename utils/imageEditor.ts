export enum EditorMode {
  DISABLED,
  RECT,
  TEXT,
  GRAB,
  LINE,
}

export const ZOOM_STEP = 0.1;

export type ImageEditorActionConfig = {
  [key in EditorMode]: {
    icon: string;
    onActionPicked: () => void;
    cursor: string;
    menuIndex?: number;
    mouseEvents: {
      up: (ev: MouseEvent) => Promise<void> | void;
      down: (ev: MouseEvent) => Promise<void> | void;
      move: (ev: MouseEvent) => Promise<void> | void;
      scroll?: (ev: WheelEvent, scrollUp: boolean) => Promise<void> | void;
    };
    keyEvents?: {
      down: (keyCode: string) => void,
      up: (keyCode: string) => void,
    }
  };
};

export function scale(
  vect: { x: number; y: number } | [number, number],
  zoom: number,
): { x: number; y: number } {
  const resultVect = {
    x: 0,
    y: 0,
  };

  if (Array.isArray(vect) && vect.length == 2) {
    resultVect.x = vect[0];
    resultVect.y = vect[1];
  } else if (
    !Array.isArray(vect) &&
    vect &&
    typeof vect?.x === "number" &&
    typeof vect?.y === "number"
  ) {
    resultVect.x = vect.x;
    resultVect.y = vect.y;
  } else {
    throw new Error("Bad arguments in scale()");
  }
  if (typeof zoom !== "number") {
    throw new Error("Zoom value is not set when trying to scale vector");
  }

  return {
    x: resultVect.x * zoom,
    y: resultVect.y * zoom,
  };
}

export function applyZoom(square: SquareWithZoom, canvasZoom: number): Square {
  const { x, y, z, w, h } = square;
  const zoom = canvasZoom / z;
  const { x: zoomedWidth, y: zoomedHeight } = scale([w, h], zoom);
  const { x: zoomedX, y: zoomedY } = scale([x, y], zoom);

  const scaledSquare: Square = [
    zoomedX,
    zoomedY,
    zoomedWidth,
    zoomedHeight,
  ];

  return scaledSquare;
}

export function applyCamera(
  square: Square,
  cameraPosition: [number, number]): Square  {
  const scaledSquare: Square = [
    square[0] + cameraPosition[0],
    square[1] + cameraPosition[1],
    square[2],
    square[3],
  ];

  return scaledSquare;
}

// The main mouse position tool that is relative to the canvas element
export function mousePosition(ev: MouseEvent, canvas: HTMLCanvasElement | undefined): { x: number; y: number } {
  const { x, y, offsetX, offsetY, target } = ev;

  // if inside canvas, return offsetX offsetY (as they will be mouse pos relative to canvas pos)
  if ((target as HTMLElement)?.tagName === 'CANVAS') {
    return {
      x: offsetX,
      y: offsetY,
    }
  } else if (canvas) {
    // if mouse target is not canvas, we must be outside (as no elements are inside canvas)
    // because of that, we want to return the client pos minus the canvas pos.
    // NOTE: This fixes the mouse position when the mouse is outside the canvas
    const canvasRect = canvas.getBoundingClientRect();
    const result = {
      x: x - canvasRect.x,
      y: y - canvasRect.y,
    };
    return result;
  } else {
    // TODO: report
    console.warn('mouse event missing canvas. Positions in the image editor might be uncalibrated for this event');
    return { x, y };
  }

}

export function mouseRect(
  ev: MouseEvent,
  canvas: HTMLCanvasElement, beginX: number, beginY: number, z: number
): SquareWithZoom {
  const { x, y } = mousePosition(ev, canvas);

  // TODO: support boxes made from other direction
  // TODO: test if already possible? it seems :S
  const square: SquareWithZoom = {
    x: beginX,
    y: beginY,
    z: z,
    w: x - beginX,
    h: y - beginY,
  };

  return square;
};