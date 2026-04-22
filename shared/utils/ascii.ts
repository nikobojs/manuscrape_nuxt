/**
 * converts a filename with special characters to a safe ASCII string.
 * replaces known characters (like ø, æ) with approximations and removes non-ASCII characters.
 */
export function toAsciiSafeFilename(filename: string) {
  if (!filename) return "";

  // map of common special characters to ASCII approximations
  const charMap: Record<string, string> = {
    ø: "o",
    Ø: "O",
    æ: "ae",
    Æ: "AE",
    å: "a",
    Å: "A",
    ä: "a",
    Ä: "A",
    ö: "o",
    Ö: "O",
    ü: "u",
    Ü: "U",
    é: "e",
    É: "E",
    è: "e",
    È: "E",
    à: "a",
    À: "A",
    ñ: "n",
    Ñ: "N",
    ç: "c",
    Ç: "C",
    ß: "ss",
    ẞ: "SS",
  };

  // replace mapped characters
  let result = filename.replace(/[øØæÆåÅäÄöÖüÜéÈàÀñÑçÇßẞ]/g, (char: string) => {
    const replacedChar = charMap[char];
    return replacedChar || char;
  });

  // remove any remaining non-ASCII characters (keep only a-z, A-Z, 0-9, space, dot, dash, underscore)
  result = result.replace(/[^\w\s.-]/g, "");

  // collapse multiple spaces/hyphens and trim
  result = result.trim().replace(/\s+/g, "-");

  return result;
}
