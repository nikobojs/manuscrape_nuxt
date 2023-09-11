
export const isValidNumber = (v: any) => typeof v === 'number' && !isNaN(v);
export const numberBetween = (min: number, max: number) => (v: number) => {
  return isValidNumber(v) && v >= min && v < max;
}
export const isEmail = (email: string) => {
  if (
    !email ||
    !email?.length ||
    email.indexOf('@') === -1 ||
    email.indexOf('.') === -1 ||
    email.lastIndexOf('.') < email.indexOf('@')
  ) {
    return false;
  } else {
    return /.+@.+\..+/.test(email);
  }
}