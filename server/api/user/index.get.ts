export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  return getFullUserById(user.id);
});
