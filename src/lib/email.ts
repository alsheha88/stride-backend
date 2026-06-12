import { Resend } from "resend";
import { logger } from "./logger.js";
import { env } from "./env.js";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

let resend: Resend | undefined;

export const setupEmail = async () => {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  resend = new Resend(env.RESEND_API_KEY);
};

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  if (!resend) {
    throw new Error("Resend is not initialized. setupEmail() must be called first.");
  }

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (result.error) {
    throw new Error(`Failed to send email: ${result.error.message}`);
  }

  logger.info( {emailId: result.data?.id} ,"Email sent:");
  return result.data?.id;
};