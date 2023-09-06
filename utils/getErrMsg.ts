export function getErrMsg(err: any) {
  return (
    err.data?.message ||
    err?.message ||
    err?.statusMessage ||
    'Unknown error'
  ).toString();
}