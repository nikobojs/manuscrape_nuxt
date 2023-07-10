export default defineEventHandler(async (event) => {
  event.context.user = null;

  setCookie(event, 'authcookie', '');

  return {}
})
