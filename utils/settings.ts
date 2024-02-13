export const ScrollshotSettingInputs: IScrollshotSettingInput[] = [
  {
    label: 'Rows pr. crop',
    help: 'How many pixel rows to include in each scan crop',
    type: 'number',
    name: 'rowsPrCrop',
  },
  {
    label: 'Columns pr. crop',
    name: 'colsPrCrop',
    type: 'number',
    help: 'How many columns to include in each scan crop.',
  },
  {
    name: 'leftCropFrom',
    type: 'number',
    help: 'When cropping out centers on the left side, where should this crop start?',
    label: 'Left crop from'
  },
  {
    name: 'leftCropTo',
    type: 'number',
    help: 'When cropping out centers on the left side, where should this crop end?',
    label: 'Left crop to'
  },
  {
    name: 'rightCropFrom',
    type: 'number',
    help: 'When cropping out centers on the right side, where should this crop start?',
    label: 'Right crop from',
  },
  {
    name: 'rightCropTo',
    type: 'number',
    help: 'When cropping out centers on the right side, where should this crop end?',
    label: 'Right crop to',
  },
  {
    label: 'Denoising factor',
    name: 'denoisingFactor',
    type: 'number',
    step: 0.01,
    help: 'How much to denoise the image. 0.0 means no denoising.',
  },
  {
    name: 'matchScoreThreshold',
    type: 'number',
    label: 'Match score threshold',
    step: 0.01,
    help: 'How high the maximum match score can be before we determine an error has occurred when matching images.',
  },
];


export function renderScrollshotSettings(
  settings: Record<string, any>,
) {
  const inputs = [...ScrollshotSettingInputs];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const el: HTMLInputElement | null = document.querySelector(`input#${input.name}-input`)
    const inputHasSetting = Object.keys(settings).includes(input.name);

    if (el && inputHasSetting) {
      el.value = settings[input.name];
    } else if (!inputHasSetting && el) {
      const msg = `Input config '${input.name}' does not exist in server provided settings`;
      el.disabled = true;
      console.warn(msg);
    } else if (!el) {
      const msg = `Input config '${input.name}' does not match any input element in DOM`
      console.warn(msg);
    }
  }
}

export function getSettingsPatch(inputs: IScrollshotSettingInput[]) {
  const patch: Record<string, number | string> = {}
  for (const input of inputs) {
    const elem: HTMLInputElement | null = document.querySelector(`input#${input.name}-input`);
    if (!elem) throw new Error('Input element was not found');
    if (input.type === 'number' && (Number.isInteger(input.step) || !input.step)) {
      patch[input.name] = parseInt(elem.value);
    } else if (input.type === 'number' && !Number.isInteger(input.step)) {
      patch[input.name] = parseFloat(elem.value);
    } else {
      patch[input.name] = elem.value;
    }
  }
  return patch;
}

export function disableAllSettingsInputs(inputs: IScrollshotSettingInput[]) {
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const el: HTMLInputElement | null = document.querySelector(`input#${input.name}-input`)
    el && (el.disabled = true);
  }
}
export function enableAllSettingsInputs(inputs: IScrollshotSettingInput[]) {
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const el: HTMLInputElement | null = document.querySelector(`input#${input.name}-input`)
    el && (el.disabled = false);
  }
}