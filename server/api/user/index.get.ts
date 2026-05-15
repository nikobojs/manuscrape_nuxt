export default safeResponseHandler(async (event) => {
  const { id } = await requireUser(event);
  return getFullUserById(id);
});
