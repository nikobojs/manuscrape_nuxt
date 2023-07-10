import jwt from 'jsonwebtoken';

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
    const cookieValue = getCookie(event, 'authcookie');
    const authToken = event.req.headers.authentication || cookieValue;
    let loginSuccesfull = false;
    
    if (!authToken) {
        if (event.req.method === 'GET' && !['/login'].includes(event.path)) {
            await sendRedirect(event, '/login', 302);
        } else if (event.req.method === 'POST' && !['/api/user', '/api/auth'].includes(event.path)) {
            throw createError({
                statusCode: 401,
                statusMessage: 'You are not logged in. Please log in and try again'
            });
        }
    }
    else if (typeof authToken == 'string' && authToken.length > 0) {
        const decoded = await jwt.verify(authToken, config.app.tokenSecret);

        if (typeof decoded !== 'string' && decoded?.id) {
            event.context.auth = {
                id: decoded.id
            };
            loginSuccesfull = true;
        }
    }

    if (loginSuccesfull && event.path == '/login' && event.req.method === 'GET') {
        await sendRedirect(event, '/', 302);
    }
})