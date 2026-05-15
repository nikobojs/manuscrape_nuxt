export function escapeHTML(s: string) {
  return s.replace(/[^0-9A-Za-z ]/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

export const generateMail = (
  subject: string,
  content: string,
  preview: string,
  recipientLoggedInAs: string | undefined,
  isAdminNotification = false,
) => {
  const baseUrl = useRuntimeConfig().public.baseUrl;
  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${escapeHTML(subject)}</title>
        <style media="all" type="text/css">
          body {
            font-family: Helvetica, sans-serif;
            -webkit-font-smoothing: antialiased;
            font-size: 16px;
            line-height: 1.3;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
          }

          table {
            border-collapse: separate;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            width: 100%;
          }

          table td {
            font-family: Helvetica, sans-serif;
            font-size: 16px;
            vertical-align: top;
          }
          body {
            background-color: #f4f5f6;
            margin: 0;
            padding: 0;
          }

          .body {
            background-color: #f4f5f6;
            width: 100%;
          }

          .container {
            margin: 0 auto !important;
            max-width: 600px;
            padding: 0;
            padding-top: 24px;
            width: 600px;
          }

          .content {
            box-sizing: border-box;
            display: block;
            margin: 0 auto;
            max-width: 600px;
            padding: 0;
          }
          .main {
            background: #ffffff;
            border: 1px solid #eaebed;
            border-radius: 8px;
            width: 100%;
          }

          .wrapper {
            box-sizing: border-box;
            padding-top: 32px;
            padding-bottom: 24px;
            padding-left: 24px;
            padding-right: 24px;
          }

          .footer {
            clear: both;
            padding-top: 24px;
            text-align: left;
            width: 100%;
          }

          .footer td,
          .footer p,
          .footer span,
          .footer a {
            color: #9a9ea6;
            font-size: 14px;
            text-align: left;
          }
          p {
            font-family: Helvetica, sans-serif;
            font-size: 16px;
            font-weight: normal;
            margin: 0;
            margin-bottom: 16px;
          }

          a {
            color: #0867ec;
            text-decoration: underline;
          }
          .btn {
            box-sizing: border-box;
            min-width: 100% !important;
            width: 100%;
          }

          .btn > tbody > tr > td {
            padding-bottom: 16px;
          }

          .btn table {
            width: auto;
          }

          .btn table td {
            background-color: #ffffff;
            border-radius: 4px;
            text-align: center;
          }

          .btn a {
            background-color: #ffffff;
            border: none;
            border-radius: 4px;
            box-sizing: border-box;
            color: #0867ec;
            cursor: pointer;
            display: inline-block;
            font-size: 15px;
            margin: 0;
            padding: 10px 24px;
            text-decoration: none;
            text-transform: capitalize;
            transition: all .2s ease;
          }

          .btn-primary table td {
            background-color: #34619a;
          }

          .btn-primary a {
            background-color: #34619a;
            border-color: #0f172b;
            color: #ffffff;
          }

          @media all {
            .btn-primary table td:hover {
              background-color: #197fff !important;
            }
            .btn-primary a:hover {
              background-color: #197fff !important;
              border-color: #197fff !important;
            }
          }
          .last {
            margin-bottom: 0;
          }

          .first {
            margin-top: 0;
          }

          .align-center {
            text-align: center;
          }

          .align-right {
            text-align: right;
          }

          .align-left {
            text-align: left;
          }

          .text-link {
            color: #0867ec !important;
            text-decoration: underline !important;
          }

          .clear {
            clear: both;
          }

          .mt0 {
            margin-top: 0;
          }

          .mb0 {
            margin-bottom: 0;
          }

          .preheader {
            color: transparent;
            display: none;
            height: 0;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
            mso-hide: all;
            visibility: hidden;
            width: 0;
          }

          .powered-by a {
            text-decoration: none;
          }
          @media only screen and (max-width: 640px) {
            .main p,
            .main td,
            .main span {
              font-size: 16px !important;
            }
            .wrapper {
              padding: 8px !important;
            }
            .content {
              padding: 0 !important;
            }
            .container {
              padding: 0 !important;
              padding-top: 8px !important;
              width: 100% !important;
            }
            .main {
              border-left-width: 0 !important;
              border-radius: 0 !important;
              border-right-width: 0 !important;
            }
            .btn table {
              max-width: 100% !important;
              width: 100% !important;
            }
            .btn a {
              font-size: 16px !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
          @media all {
            .ExternalClass {
              width: 100%;
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
              line-height: 100%;
            }
            .apple-link a {
              color: inherit !important;
              font-family: inherit !important;
              font-size: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
              text-decoration: none !important;
            }
            #MessageViewBody a {
              color: inherit;
              text-decoration: none;
              font-size: inherit;
              font-family: inherit;
              font-weight: inherit;
              line-height: inherit;
            }
          }
        </style>
      </head>
      <body>
        <table
          role="presentation"
          border="0"
          cellpadding="0"
          cellspacing="0"
          class="body"
        >
          <tr>
            <td>&nbsp;</td>
            <td class="container">
              <div class="content">
                <span class="preheader">${preview}</span>
                <table
                  role="presentation"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="main"
                >
                  <tr>
                    <td class="wrapper">
                      <div>
                        <div style="margin-bottom:22px">
                          <img style="max-width:200px;width:100%" src="https://manuscrape.org/img/manuscrape-logo-small.jpg" />
                        </div>
                        ${content}
                      </div>
                    </td>
                  </tr>
                </table>
                <div class="footer">
                  <table
                    role="presentation"
                    border="0"
                    cellpadding="2"
                    cellspacing="0"
                  >
                    <tr>
                      <td class="content-block">
                        <span>
                        ${
                          isAdminNotification
                            ? `

                            This email is a notification sent to your
                            <a target="_blank" href="${baseUrl}">${baseUrl}</a> admin user "${recipientLoggedInAs}".
                            <br />

                        `
                            : recipientLoggedInAs
                              ? `
                          This email is a system email sent to your <a target="_blank" href="${baseUrl}">${baseUrl}</a> user "${recipientLoggedInAs}".<br />
                        `
                              : `
                          You received this email because you requested a new
                          ${baseUrl} account. We will delete all your data if you don't finish the account registration.
                          <br />
                          <br />
                        `
                        }
                        </span>
                        <p>If anything seems wrong, please contact the maintainers at
                        <a href="mailto:hello@codecollective.dk">hello@codecollective.dk</a>.
                        </p>
                        <span class="apple-link">ManuScrape.org &copy ${new Date().getFullYear()} Code Collective ApS, VAT DK46072138</span>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </td>
            <td>&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return html;
};
