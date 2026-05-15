import { generateMail, escapeHTML } from "../template";

export const resetPasswordTemplate = (
  username: string,
  resetPasswordLink: string,
): string => {
  const content = `
    <p>Hello ${escapeHTML(username)}!</p>
    <p>You just requested a password reset. If this was not you, please contact the administrators immediatly. If it was, please click the link below to set a new password.</p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
      <tbody>
        <tr>
          <td align="left">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
              <tbody>
                <tr>
                  <td><a href="${resetPasswordLink}" target="_blank">Reset password</a></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
  const fullHtml = generateMail(
    "Please verify your email",
    content,
    "",
    username,
  );
  return fullHtml;
};
