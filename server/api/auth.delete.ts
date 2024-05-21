import { safeResponseHandler } from "../utils/safeResponseHandler";

export default safeResponseHandler(async (event) => {
  event.context.user = undefined;
  resetAuthCookie(event);
  return {};
});
