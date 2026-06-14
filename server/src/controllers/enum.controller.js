import { BookingSource, BookingStatus, CouponType, MovieStatus, NotificationType, PaymentStatus, PricingType, RefundStatus, ReviewStatus, screenType, SeatStatus, SeatType, ShowSeatStatus, ShowStatus, TicketStatus, UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

export const getEnum = asyncHandler(async (req, res) => {
    const { type } = req.query;
    console.log(type);
    if (!type) throw new ApiError.badRequest("Type is required");
    switch (type) {
        case "userRole":
            return apiResponse(res, 200, true, "User roles fetched successfully", Object.values(UserRole));
        case "movieStatus":
            return apiResponse(res, 200, true, "Movie statuses fetched successfully", Object.values(MovieStatus));
        case "seatStatus":
            return apiResponse(res, 200, true, "Seat statuses fetched successfully", Object.values(SeatStatus));
        case "seatType":
            return apiResponse(res, 200, true, "Seat types fetched successfully", Object.values(SeatType));
        case "screenType":
            return apiResponse(res, 200, true, "Screen types fetched successfully", Object.values(screenType));
        case "paymentStatus":
            return apiResponse(res, 200, true, "Payment statuses fetched successfully", Object.values(PaymentStatus));
        case "bookingStatus":
            return apiResponse(res, 200, true, "Booking statuses fetched successfully", Object.values(BookingStatus));
        case "userStatus":
            return apiResponse(res, 200, true, "User statuses fetched successfully", Object.values(UserStatus));
        case "showStatus":
            return apiResponse(res, 200, true, "Show statuses fetched successfully", Object.values(ShowStatus));
        case "showSeatStatus":
            return apiResponse(res, 200, true, "Show seat statuses fetched successfully", Object.values(ShowSeatStatus));
        case "ticketStatus":
            return apiResponse(res, 200, true, "Ticket statuses fetched successfully", Object.values(TicketStatus));
        case "reviewStatus":
            return apiResponse(res, 200, true, "Review statuses fetched successfully", Object.values(ReviewStatus));
        case "pricingType":
            return apiResponse(res, 200, true, "Pricing types fetched successfully", Object.values(PricingType));
        case "bookingSource":
            return apiResponse(res, 200, true, "Booking sources fetched successfully", Object.values(BookingSource));
        case "refundStatus":
            return apiResponse(res, 200, true, "Refund statuses fetched successfully", Object.values(RefundStatus));
        case "couponType":
            return apiResponse(res, 200, true, "Coupon types fetched successfully", Object.values(CouponType));
        case "notificationType":
            return apiResponse(res, 200, true, "Notification types fetched successfully", Object.values(NotificationType));
        default:
            throw ApiError.badRequest("Invalid type");
    };
});