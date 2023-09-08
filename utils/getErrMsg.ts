export function getErrMsg(err: any) {
  const objWithMsg = err.error?.value ? err.error.value : err;

  return (
    objWithMsg.data?.message ||
    objWithMsg.data?.statusMessage ||
    objWithMsg?.message ||
    objWithMsg?.statusMessage ||
    'Unknown error'
  ).toString();
}