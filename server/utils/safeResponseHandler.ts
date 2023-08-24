import type { EventHandler, H3Event } from 'h3'
import { ValidationError } from 'yup'

export const safeResponseHandler = (handler: EventHandler) =>
  defineEventHandler(async (event: H3Event) => {
    try {
      // do something before the route handler
      const response = await handler(event)
      // do something after the route handler
      return response
    } catch (err) {
      // Error handling
      console.error('----------------  Safe response handler caught error! --------------')
      console.error(err)
      console.error('----------------     -     ---------------     -     ---------------');

      let msg = 'Unexpected server error';
      let status = 500;

      if (err instanceof ValidationError) {
        msg = err.errors[0];
        status = 400;
      }

      console.log('STATUS CODE:::::', event.res.statusCode)
      // TODO: set correct status code (dont allow 2xx codes)

      throw createError({
        statusCode: status,
        statusMessage: msg,
      });
    }
  })