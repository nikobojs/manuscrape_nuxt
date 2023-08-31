// TODO: implement logging feature
export default defineEventHandler((event) => {
    console.info(
        event.req.method,
        getRequestURL(event).pathname,
        '->',
        event.res.statusCode,
        event.res.statusMessage || '',
    )
})