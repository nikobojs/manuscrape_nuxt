import { Prisma } from '@prisma/client'
import { type EventHandler, type H3Event, H3Error } from 'h3'
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

      if (err instanceof H3Error) {
        status = err?.statusCode || 500;
        const cause = err?.cause || ({} as any);
        msg = cause?.message || cause?.statusMessage || err.message || err.statusMessage;
      } else if (err instanceof ValidationError) {
        msg = err.errors[0];
        status = 400;
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        status = 400;
        msg = 'Database error. Your input values can probably not be written to database.';
        longMsg = err.message
      } else if (err?.name === 'Error' && Object.values(formidableErrors).includes(err?.code)) {
        status = 400;
        if (err?.message) msg = err?.message;
        if (err?.httpCode) status = err?.httpCode;
      } else if (err instanceof H3Error) {
        if (err.statusCode) status = err.statusCode;
        if (err.statusMessage) msg = err.statusMessage;
      } else {
        // Error handling
        console.error('----------------  Safe response handler caught error! --------------')
        console.error('NAME:', err?.name)
        console.error('KEYS:', Object.keys(err))
        console.error(err)
        console.error('----------------     -     ---------------     -     ---------------');
      }

      setResponseStatus(event, status);
      return {
        url: getRequestURL(event).pathname,
        statusCode: status,
        statusMessage: msg,
        message: longMsg || msg,
      }
    }
  })