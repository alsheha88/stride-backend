import { Resend } from "resend";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

let resend: Resend | undefined;

export const setupEmail = async () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  resend = new Resend(process.env.RESEND_API_KEY);
};

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  if (!resend) {
    throw new Error("Resend is not initialized. setupEmail() must be called first.");
  }

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Stride <noreply@stridedev.dev>",
    to,
    subject,
    html,
  });

  if (result.error) {
    throw new Error(`Failed to send email: ${result.error.message}`);
  }

  console.log("Email sent:", result.data?.id);
  return result.data?.id;
};