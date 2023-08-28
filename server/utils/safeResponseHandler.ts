import { PrismaClientValidationError } from '@prisma/client/runtime/library'
import type { EventHandler, H3Event } from 'h3'
import { ValidationError } from 'yup'
import { errors as formidableErrors } from 'formidable';

export const safeResponseHandler = (handler: EventHandler) =>
  defineEventHandler(async (event: H3Event) => {
    try {
      // do something before the route handler
      const response = await handler(event)
      // do something after the route handler
      return response
    } catch (err: any) {
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
      } else if (err?.name === 'Error' && Object.values(formidableErrors).includes(err?.code)) {
        status = 400;
        if (err?.message) msg = err?.message;
        if (err?.httpCode) status = err?.httpCode;
      } else {
        // Error handling
        console.error('----------------  Safe response handler caught error! --------------')
        console.error('NAME:', err?.name)
        console.error('KEYS:', Object.keys(err))
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