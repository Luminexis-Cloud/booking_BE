const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: `email-smtp.${process.env.SES_REGION}.amazonaws.com`,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASS,
  },
});


exports.sendMail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  return info; // 👈 REQUIRED
};
