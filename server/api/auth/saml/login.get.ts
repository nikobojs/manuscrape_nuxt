import passport from "passport";

export default defineEventHandler(async (event) => {
  // cast needed: the fork types use @types/express 4, the app has 5
  passport.use(getSamlStrategy() as any);

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
