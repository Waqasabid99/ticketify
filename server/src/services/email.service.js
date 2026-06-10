import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateVerificationToken, generatePasswordResetToken, verifyVerificationToken } from "../utils/helper.js";
import { transporter } from "../config/mail.js";
import ejs from "ejs";
import path from "path";
import { ApiError } from "../utils/error.js";
import { apiResponse } from "../utils/asyncHandler.js";
import { UserStatus } from "../generated/prisma/enums.ts";

const templatePath = path.join(
    process.cwd(),
    "src/templates/verification.ejs"
);

const bookingTemplatePath = path.join(
    process.cwd(),
    "src/templates/booking-confirmation.ejs"
);

export const sendVerificationEmail = asyncHandler(async (user) => {
    const { id, email, fullName } = user;
    const verificationToken = generateVerificationToken(id);
    const verificationUrl = `${process.env.CORS_ORIGIN}/verify?token=${verificationToken}`;

    const emailHtml = await ejs.renderFile(templatePath, {
        name: fullName,
        verificationUrl,
        expiryMinutes: 10,
        currentYear: new Date().getFullYear(),
    });

    // store in DB
    await prisma.user.update({
        where: { id },
        data: {
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000)
        },
    });

    // send email
    await transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: email,
        subject: "Verify Your Email",
        html: emailHtml
    });

    return true;
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    console.log(token)

    if (!token) {
        throw ApiError.badRequest(
            "Verification token is required"
        );
    }

    const decoded = verifyVerificationToken(token);

    console.log(decoded)

    const user = await prisma.user.findFirst({
        where: {
            id: decoded.userId,
            emailVerificationToken: token,
            emailVerificationExpiry: {
                gt: new Date(),
            },
        },
    });

    if (!user) {
        throw ApiError.badRequest(
            "Invalid or expired verification token"
        );
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            emailVerified: true,
            status: UserStatus.ACTIVE,
            emailVerificationToken: null,
            emailVerificationExpiry: null,
        },
    });

    console.log("updated", updatedUser)

    return apiResponse(
        res,
        200,
        true,
        "Email verified successfully",
        updatedUser
    );
});

export const sendBookingConfirmationEmail = asyncHandler(async (booking, tickets, qrCode) => {
    const {
        id: bookingId,
        bookingNumber,
        status,
        movieTitle,
        cinemaName,
        screenName,
        showStartTime,
        finalAmount,
        userId,
    } = booking;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) return;

    const ticketNumbers = tickets.map((t) => t.ticketNumber);
    const seatLabels = booking.seats?.map((s) => s.seatLabel) ?? [];

    const emailHtml = await ejs.renderFile(bookingTemplatePath, {
        name: user.fullName,
        email: user.email,
        bookingNumber,
        bookingId,
        status,
        movieTitle,
        cinemaName,
        screenName,
        showStartTime,
        finalAmount,
        ticketNumbers,
        seatLabels,
        qrCode,
        currentYear: new Date().getFullYear(),
    });

    await transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: user.email,
        subject: `Booking Confirmed — ${movieTitle}`,
        html: emailHtml,
    });

    return true;
});

export const sendPasswordResetEmail = asyncHandler(async (user, resetToken) => {
    const { id, email, firstName } = user;
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: email,
        subject: "Reset Your Password",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>Hi ${firstName},</p>
                <p>You requested a password reset. Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a>
                <p style="margin-top:24px;color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
                <p style="color:#6b7280;font-size:13px;">© ${new Date().getFullYear()} Ticketify</p>
            </div>
        `,
    });

    return true;
});
