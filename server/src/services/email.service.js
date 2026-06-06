import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateVerificationToken, verifyVerificationToken, } from "../utils/helper.js";
import { transporter } from "../config/mail.js";
import ejs from "ejs";
import path from "path";
import { ApiError } from "../utils/error.js";
import { UserStatus } from "../generated/prisma/enums.ts";

const templatePath = path.join(
    process.cwd(),
    "src/templates/verification.ejs"
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
            id: decoded.id,
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