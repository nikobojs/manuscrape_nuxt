import type { EventHandler, H3Event } from 'h3'

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
      console.error('----------------     -     ---------------     -     ---------------')
      return { err }
    }
  })