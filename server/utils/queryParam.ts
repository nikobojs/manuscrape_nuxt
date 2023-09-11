export function queryParam<T>(opts: QueryParamOptions<T>) : T | undefined {
  const {
    name,
    event,
    parse,
    validate,
    required,
    defaultValue,
  } = opts;
  const query = getQuery(event);
  const value = query?.[name];

  // return parsed value, if it validates
  // NOTE: if this block does not return, value is not set in query params
  if (value !== null && value !== undefined) {
    const parsed = parse(value.toString());
    const valid = validate(parsed);

    if (valid) {
      // if parsed is valid, return it
      return parsed;
    }
  }
  
  // if defaultValue is not undefined, return that
  if (defaultValue !== undefined) {
    // else if defaultValue is set, return that!
    return defaultValue;
  }

  // if required throw error
  if (required) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing query parameter '${name}'`,
    });
  }
}
