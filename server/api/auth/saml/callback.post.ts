import { sendRedirect, readBody, createError } from 'h3';
import { getSamlStrategy } from '~/server/libs/saml';
import type { H3Event } from 'h3';
import type { Profile } from 'passport-saml'; 
import { AuthSource } from '~/types/auth-source';

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event);
  const samlResponse: string | undefined = body?.SAMLResponse;

  if (!samlResponse) {
    console.error('Missing SAMLResponse');
    throw createError({ statusCode: 400, statusMessage: 'Missing SAMLResponse' });
  }

  const samlStrategy = getSamlStrategy();

  if (!samlStrategy?._saml) {
    console.error('SAML strategy not initialized');
    throw createError({ statusCode: 500, statusMessage: 'SAML strategy not initialized' });
  }

 let profile: Profile | null | undefined;

  try {
    const result = await samlStrategy._saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
    });
    profile = result.profile;
  } catch (err) {
    console.error('SAML validation failed:', err);
    throw createError({ statusCode: 401, statusMessage: 'SAML validation failed' });
  }

  
  if (!profile) {
    console.error('No profile returned from SAML response');
    throw createError({ statusCode: 401, statusMessage: 'Invalid SAML response' });
  }

  const email = profile.email ?? profile.nameID;
  if (!email) {
    console.error('Email not found in SAML profile');
    throw createError({ statusCode: 400, statusMessage: 'Email not found in SAML profile' });
  }

  let user = await db.user.findFirst({
    where: {
      OR: [
        { email },
        { samlNameId: profile.nameID ?? undefined },
      ],
    },
  });
  if (!user) {
    console.log(`Creating new user for SAML email: ${email}`);

    user = await db.user.create({
      data: {
        email,
        samlNameId: profile.nameID ?? null,
        password: null,
        authSource: AuthSource.SAML,
      },
    });
  }

  await authorize(event, user)
  
  return sendRedirect(event, '/', 302);
});
