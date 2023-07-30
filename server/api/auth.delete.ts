export default defineEventHandler(async (event) => {
  event.context.user = undefined;

  setCookie(event, 'authcookie', '');

  return {}
})
