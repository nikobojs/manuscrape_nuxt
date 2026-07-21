export default safeResponseHandler(async (event) => {
  console.log("================== LOG OUT USER BEGIN ==================");
  const res = await logoutUser(event, event.context.user);
  console.log("================== LOG OUT USER END ==================");
  event.context.user = undefined;
  return res;
});
