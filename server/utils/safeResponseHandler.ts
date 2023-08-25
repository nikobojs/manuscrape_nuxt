import { PrismaClientValidationError } from '@prisma/client/runtime/library'
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
      let msg = 'Unexpected server error';
      let status = event.res.statusCode === 200 ? 500 : event.res.statusCode;
      let longMsg;

      if (err instanceof ValidationError) {
        msg = err.errors[0];
        status = 400;
      } else if (err instanceof PrismaClientValidationError) {
        status = 400;
        msg = 'Database error. Your input values can probably not be written to database.';
        longMsg = err.message
      } else {
        // Error handling
        console.error('----------------  Safe response handler caught error! --------------')
        console.error(err)
        console.error('----------------     -     ---------------     -     ---------------');
      }

      throw createError({
        statusCode: status,
        statusMessage: msg,
        message: longMsg || msg,
      });
    }
  })