import passport from 'passport';
import { getSamlStrategy } from '~/server/libs/saml';

export default defineEventHandler(async (event) => {

  passport.use(getSamlStrategy());

  await new Promise((resolve, reject) => {
    passport.authenticate('saml', { session: false })(event.req, event.res, (err: any) => {
      if (err) reject(err);
      else resolve(null);
    });
  });
});
