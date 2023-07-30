import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { H3Event } from 'h3';

const config = useRuntimeConfig();
const prisma = new PrismaClient();

function isOpenUrl (event: H3Event): boolean {
    const openPostUrls = ['/api/user', '/api/auth'];
    const openGetUrls = ['/user/new', '/login'];
    const isPostRequest = event.req.method === 'POST';
    const isGetRequest = event.req.method === 'GET';
    const isOpenUrl = (
        isGetRequest && openGetUrls.includes(event.path) ||
        isPostRequest && openPostUrls.includes(event.path)
    );
    return isOpenUrl;
}

export default defineEventHandler(async (event) => {
    const cookieValue = getCookie(event, 'authcookie');
    const authToken = event.req.headers.authentication || cookieValue;
    let loginSuccesfull = false;

    async function onNotAuthed (
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
    
    if (!authToken && !isOpenUrl(event)) {
        return onNotAuthed();
    }
    else if (typeof authToken == 'string' && authToken.length > 0) {
        const decoded = await jwt.verify(authToken, config.app.tokenSecret);

        if (typeof decoded !== 'string' && decoded?.id) {
            const user = await prisma.user.findFirst({
                where: { id: decoded.id },
                select: {
                    id: true,
                }
            });

            if (user) {
                loginSuccesfull = true;
                event.context.auth = {
                    id: user.id
                };
            } else {
                return onNotAuthed('Session is valid but user does not exist')
            }
        } else {
            return onNotAuthed('Your did not provide any authorization ');
        }
    }

    if (loginSuccesfull && ['/user/new', '/login'].includes(event.path) && event.req.method === 'GET') {
        await sendRedirect(event, '/', 302);
    }
})