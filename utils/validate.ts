
export const isValidNumber = (v: any) => typeof v === 'number' && !isNaN(v);
export const numberBetween = (min: number, max: number) => (v: number) => {
  return isValidNumber(v) && v >= min && v < max;
}

