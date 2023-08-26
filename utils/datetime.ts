export function prettyDate(
  d: Date | string,
  includeTime = true
): string {
  if (typeof d === 'string') {
    d = new Date(d);
  }
  const twoDigits = (n: number): string => n < 10 && n > -1 ? '0' + n : '' + n;
  const year = twoDigits(d.getFullYear());
  const month = twoDigits(d.getMonth() + 1);
  const date = twoDigits(d.getDate());

  let result = `${year}-${month}-${date}`;

  if (includeTime) {
    const hour = twoDigits(d.getHours());
    const minute = twoDigits(d.getMinutes());
    const time = `${hour}:${minute}`;
    result += ' ' + time;
  }

  return result;
}