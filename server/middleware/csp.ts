// export default function (req: any, res: any, next: any) {
export default defineEventHandler((event) => {
  const res = event.res
  res?.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline';")
  res?.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  res?.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res?.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
});