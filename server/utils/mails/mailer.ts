import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { captureException } from "@sentry/node";

let _mailer:
  | nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
  | undefined = undefined;

// TODO: run when app runs, to verify SMTP connection to some degree
export async function getMailer(
  debug = false,
): Promise<
  nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
> {
  if (_mailer) return _mailer;
  const config = useRuntimeConfig();
  const port = parseInt(config.smtpPort);

  if (debug) {
    console.log("creating secure transport..", {
      host: config.smtpHost,
      user: config.smtpUser,
      pass: config.smtpPass,
      from: config.smtpFrom,
    });
  }

  _mailer = nodemailer.createTransport({
    name: "codecoll.eu",
    host: config.smtpHost,
    port: port,
    tls: {
      host: config.smtpHost,
      servername: config.smtpTlsHost,
      rejectUnauthorized: true,
      minVersion: "TLSv1.3",
      port: port,
    },
    requireTLS: false,
    ignoreTLS: true,
    secure: true,
    auth: {
      type: "login",
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    debug: debug,
    logger: debug,
    greetingTimeout: 3000,
    connectionTimeout: 6000,
  });

  try {
    if (debug) console.log("verifying transport..");
    await _mailer.verify();
    console.info("> nodemailer connection verified");
  } catch (err) {
    console.error("smtp server verification error", err);
    captureException(err);
  }

  return _mailer;
}

export async function sendMail(to: string, subject: string, html: string) {
  const config = useRuntimeConfig();
  const debug = process.env.NODE_ENV !== "production";

  if (process.env.VITEST === "true") {
    console.log("not sending mail, because VITEST is true");
    return;
  }

  const mailer = await getMailer();
  const res = await mailer.sendMail({
    to,
    subject,
    html: html,
    //    xMailer: `Timeplat.eu v${pkg.version}`,
    from: config.smtpFrom,
    debug: debug,
    logger: debug,
  });

  if (debug) console.log("mail server response:", res);

  if (res.accepted) {
    console.log("email was sent to", to);
  } else {
    console.error("email to", to, "was rejected:");
    console.error(res);
    throw new Error("Email was rejected!");
  }
}
