const nodemailer = require("nodemailer");

exports.email = async (data) => {
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
    to: "seabeefs@gmail.com",
    subject: "Hello ✔",
    text: "Hello world?", 
    html: "<b>Hello world?</b>",a
  });

  console.log("Message sent:", info.messageId);
};
