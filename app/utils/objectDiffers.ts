/**
 * Deep‑compare two objects for equality.
 * Returns true if the values are *different*.
 */
function differs(a: any, b: any): boolean {
  // hast path – same reference or primitive equality
  if (a === b) return false;

  // one of them is null/undefined while the other isn’t
  if (a == null || b == null) return true;

  // fifferent constructors (e.g., Date vs plain object)
  if (a.constructor !== b.constructor) return true;

  // handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() !== b.getTime();
  }

  // handle Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (differs(a[i], b[i])) return true;
    }
    return false;
  }

  // Handle plain objects (Record<string, any>)
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    // Different number of own properties
    if (aKeys.length !== bKeys.length) return true;

    // Check each key/value pair
    for (const key of aKeys) {
      if (!b.hasOwnProperty(key)) return true; // missing key in b
      if (differs(a[key], b[key])) return true; // nested diff
    }
    return false;
  }

  // All other cases (functions, symbols, etc.) – treat as different if not strictly equal
  return true;
}

/**
 * Public API – tells whether two objects differ.
 *
 * @param obj1 First object to compare.
 * @param obj2 Second object to compare.
 * @returns `true` if any property/value differs, otherwise `false`.
 */
export function objectDiffers(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
): boolean {
  const result = differs(obj1, obj2);
  return result;
}
