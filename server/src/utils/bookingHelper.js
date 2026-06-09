import { ApiError } from "./error.js";
import crypto from "crypto"
import qrcode from "qrcode";
import { API_VERSION } from "../../index.js";

export const generateBookingNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${date}-${rand}`;
};

export const generateTicketNumber = () =>
    `TK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

export const generateQrCode = async () => {
    try {
        const token = crypto.randomUUID();

        const verificationUrl =
            `${process.env.BACKEND_URL || "http://localhost:8000"}${API_VERSION}/tickets/verify/${token}`;

        // const qrImage = await qrcode.toString(verificationUrl, {
        //     width: 10,
        //     type: "terminal"
        // });

        const qrImage = await qrcode.toDataURL(verificationUrl, {
            width: 300,
            margin: 2
        });

        return {
            token,
            qrImage,
        };
    } catch (error) {
        throw ApiError.internal(
            "Failed to generate QR code"
        );
    }
};