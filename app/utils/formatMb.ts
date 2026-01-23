export function formatMb(inp: number | string): string {
  if (typeof inp === 'string') {
    inp = parseInt(inp);
    if (isNaN(inp)) throw new Error('Input size is not a number');
  }

  inp = (inp / 1000 / 1000).toFixed(1);

  return inp.toString() + ' MB';
}

export function formatKb(inp: number | string): string {
  if (typeof inp === 'string') {
    inp = parseInt(inp);
    if (isNaN(inp)) throw new Error('Input size is not a number');
  }

  inp = (inp / 1000).toFixed(1);

  return inp.toString() + ' kB';
}