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

export const fourDigitYear = (event: Event) => {
  const target = (event.target as any | null);
  let date = target?.value;
  if (date && target) {
    let dateArr = date.split("-");
    if (dateArr[0] && dateArr[0].length > 4) {
      dateArr[0] = dateArr[0].substr(0, 4);
      date = dateArr.join("-");
      target.value = date;
      target.modelValue = date;
      return date;
    }
  }
};

export function daysInFuture (days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
