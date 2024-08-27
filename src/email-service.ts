import nodemailer from 'nodemailer';

export async function sendEmail(subject: string, content: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject,
    html: content,
  });
}
