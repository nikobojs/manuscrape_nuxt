import passport from "passport";

export default defineEventHandler(async (event) => {
  passport.use(getSamlStrategy());

  await new Promise((resolve, reject) => {
    passport.authenticate("saml", { session: false })(
      event.req,
      event.res,
      (err: any) => {
        if (err) reject(err);
        else resolve(null);
      },
    );
  });
});
