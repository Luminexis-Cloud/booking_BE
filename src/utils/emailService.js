const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // REQUIRED for 587
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});


exports.sendMail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: "Luminexis <m.noumannaveed@luminexiscloud.com>",
    to,
    subject,
    html,
  });
  console.log(info);
  
  return info; // 👈 REQUIRED
};
