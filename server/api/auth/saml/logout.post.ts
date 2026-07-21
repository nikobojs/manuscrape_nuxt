// TODO: maybe deprecate this as logoutUser handles both auth types
export default defineEventHandler(async (event) => {
  await logoutUser(event, event.context.user);
  event.context.user = undefined;
  return {};
});
