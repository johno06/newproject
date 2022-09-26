const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVICE,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = {
  sendVerificationEmail: async (senderAddress, link) => {
    let error = false;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: senderAddress,
        subject: "Verify your email",
        html: `Please verify your email by clicking the link below <br/> This token will only be valid for 7d!
      <a href="${link}">Confirmation Link</a>`,
      });
    } catch (error) {
      error = true;
    }
    return error;
  },

  sendForgotPasswordEmail: async (senderAddress, link) => {
    let error = false;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: senderAddress,
        subject: "Reset Password",
        html: `Reset your password by clicking the link below <br/> This link will only be valid for 7d!
      <a href="${link}">Confirmation Link</a>`,
      });
    } catch (error) {
      error = true;
    }
    return error;
  },
};
