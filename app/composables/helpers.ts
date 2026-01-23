export function requireNumber(
  input: number | string | undefined | null | string[],
  name: string = 'input'
): number {
    if (!input) {
      throw new Error(`Could not parse number '${name}' because it is falsy`);
    } else if (typeof input === 'string') {
      input = parseInt(input);
    } else if (typeof input === 'number') {
      return input;
    } else if (Array.isArray(input)) {
      input = parseInt(input.join(''));
    }
    
    if (isNaN(input)) {
      throw new Error(`Could not parse number '${name}' because it becomes NaN`);
    }

    return input;
}