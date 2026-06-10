import nodemailer from "nodemailer";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

let transporter: nodemailer.Transporter | undefined;

export const setupEmail = async () => {
  transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY,
    },
  });
};

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  if (!transporter)
    throw new Error(
      "Transporter doesn't exist. setupEmail() must be called first.",
    );

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Stride <noreply@stridedev.dev>",
    to: to,
    subject: subject,
    html: html,
  });

  console.log("Email sent:", info.messageId);

  return info.messageId;
};