import prisma from "../config/prisma.js";
import { TicketStatus } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

export const verifyTicket = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) throw ApiError.notFound("Token not found.");

    const verify = await prisma.ticket.findFirst({
        where: {
            qrCode: token,
            status: TicketStatus.ACTIVE,
        },
    });

    if (!verify) throw ApiError.notFound("This token doesn't exist.");

    if (verify.status === TicketStatus.USED) {

        const invalidate = await prisma.ticket.update({
            where: {
                id: verify.id,
            },
            data: {
                status: TicketStatus.CANCELLED,
                validatedAt: new Date(),
            },
        });
        return apiResponse(res, 200, true, "This token has been used before.", invalidate);
    };

    const validate = await prisma.ticket.update({
        where: {
            id: verify.id,
        },
        data: {
            status: TicketStatus.USED,
            checkedInAt: new Date(),
        },
    });
    console.log("Validated ticket", validate);
    return apiResponse(res, 200, true, "Token has been validated.", validate);


});