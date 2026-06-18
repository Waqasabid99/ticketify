import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
host: process.env.SMTP_HOST || "localhost",
port: Number(process.env.SMTP_PORT) || 1025,
  auth: {
    user: process.env.SMTP_USER || "1a85615680dcbe",
    pass: process.env.SMTP_PASS || "e0efa9f61ea63f"
  }
});
