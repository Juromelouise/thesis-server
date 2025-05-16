const nodemailer = require("nodemailer");

exports.email = async (data) => {
  try {
    const transporter = await nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: '"Jurome Louise De Jesus" <juromefernando@gmail.com>',
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    });

  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
