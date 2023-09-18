import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import type { H3Event, EventHandlerRequest } from 'h3';
import { isOpenUrl } from '../utils/request';
import * as url from 'url';

const config = useRuntimeConfig();
const prisma = new PrismaClient();

// TODO: refactor and improve readability
export default defineEventHandler(async (event) => {
    const cookieValue = getCookie(event, 'authcookie');
    const headers = getHeaders(event);
    const authToken = headers.authentication || cookieValue;
    const params = getRouterParams(event);
    let loginSuccesfull = false;

    if (!authToken && !isOpenUrl(event)) {
        return onNotAuthed(event);
    }

    else if (typeof authToken == 'string' && authToken.length > 0) {
        const decoded = await jwt.verify(authToken, config.app.tokenSecret);
        if (typeof decoded !== 'string' && decoded?.id) {
            const user = await prisma.user.findFirst({
                where: { id: decoded.id },
                select: {
                    id: true,
                    projectAccess: {
                      select: {
                        projectId: true,
                        role: true
                      }
                    }
                }
            });

            if (user) {
                loginSuccesfull = true;
                event.context.user = user as UserInSession;
            } else {
                return onNotAuthed(event, 'Session is valid but user does not exist')
            }
        } else {
            return onNotAuthed(event, 'Your did not provide any authorization ');
        }
    }

    if (loginSuccesfull && ['/user/new', '/login'].includes(event.path) && event.req.method === 'GET') {
        await sendRedirect(event, '/', 302);
    }
});


async function onNotAuthed (
  event: H3Event<EventHandlerRequest>,
  msg: string = 'You are not logged in. Please log in and try again'
): Promise<void> {
    const isApiUrl = event.path.startsWith('/api/');

    deleteCookie(event, 'authcookie');

    if (!isOpenUrl(event) && isApiUrl) {
        throw createError({
            statusCode: 401,
            statusMessage: msg,
        });
    } else if (!isOpenUrl(event) && !isApiUrl) {
        await sendRedirect(event, '/login', 302);
    }
}
