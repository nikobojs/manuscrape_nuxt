import { generateMail, escapeHTML } from "../template";

export const emailChangedTemplate = (
  name: string,
  oldEmail: string,
  newEmail: string,
): string => {
  const content = `
    <p>Hello ${escapeHTML(name)}!</p>
    <p>Your email has just changed from '${oldEmail}' to '${newEmail}'. If this was not you, please contact the administrators immediatly.</p>
  `;
  const fullHtml = generateMail("ManuScrape Email Changed", content, "", name);
  return fullHtml;
};
