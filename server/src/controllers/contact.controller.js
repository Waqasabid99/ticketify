import { transporter } from "../config/mail.js";
import prisma from "../config/prisma.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

export const sendContactMessage = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body

    if (!name || !email || !subject || !message) {
        throw ApiError.badRequest("Please provide all fields")
    }

    if (email.length > 100) {
        throw ApiError.badRequest("Email address is too long")
    }

    if (name.length < 2) {
        throw ApiError.badRequest("Name is too short")
    }

    if (name.length > 100) {
        throw ApiError.badRequest("Name is too long")
    }

    if (subject.length < 2) {
        throw ApiError.badRequest("Subject is too short")
    }

    if (subject.length > 100) {
        throw ApiError.badRequest("Subject is too long")
    }

    if (message.length < 2) {
        throw ApiError.badRequest("Message is too short")
    }

    if (message.length > 1000) {
        throw ApiError.badRequest("Message is too long")
    }

    const contact = await prisma.contact.create({
        data: {
            name,
            email,
            subject,
            message,
        },
        select: {
            id: true,
        }
    })

    await prisma.$transaction(async (tx) => {
        await transporter.sendMail({
            from: `${name} <${email}>`,
            to: process.env.CONTACT_EMAIL || "test@exmaple.com",
            subject: `New contact message: ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            html: `<div style="font-family: sans-serif;">
            <h1>New contact message</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message}</p>
          </div>`,
        });

        await tx.contact.update({
            where: {
                id: contact.id,
            },
            data: {
                emailSent: true,
            },
        })
    })

    return apiResponse(res, 200, true, "Message sent successfully", {});
});
