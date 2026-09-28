// NOTE: this endpoint only exists to support backward compatability with the old manuscrape clients
// - This file is to be deleted when newer native clients have been releases

export default safeResponseHandler(async (event) => {
  throw createError({
    message: "The token API is deprecated. Please update your client",
    status: 426,
  });
});
