export default defineEventHandler(async (event) => {
  event.context.user = undefined;
  resetAuthCookie(event);
  return {};
});
