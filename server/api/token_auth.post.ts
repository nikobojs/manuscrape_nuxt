import * as yup from 'yup';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const config = useRuntimeConfig();
const prisma = new PrismaClient();
const tokenAuthBody = yup.object({
  token: yup.string().required(),
}).required()

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { token } = await tokenAuthBody.validate(body)

    const decoded = await jwt.verify(token, config.app.tokenSecret);
    if (typeof decoded !== 'string' && decoded?.id) {

      const user = await prisma.user.findFirst({
        where: { id: decoded.id },
        select: {
          id: true,
        }
      });

      if (user) {
        const expires = new Date(new Date().setDate(new Date().getDate() + 365))
        event.context.auth = {
          id: user.id
        };
        setCookie(event, 'authcookie', token, {
          expires,
          httpOnly: true,
          domain: config.app.COOKIE_DOMAIN,
          sameSite: 'strict'
        });
        return { 'success': true }
      } else {
        return createError({
          statusCode: 401,
          statusMessage: 'Session is valid but user does not exist'
        })
      }
    }
});