import { PricingType, SeatType } from "../generated/prisma/enums.ts";
import { ApiError } from "./error.js";

export const validatePricingRules = (pricingRules) => {
    if (!Array.isArray(pricingRules) || !pricingRules.length) {
        throw ApiError.badRequest("At least one pricing rule is required");
    }

    const validSeatTypes = Object.values(SeatType);
    const validPricingTypes = Object.values(PricingType);
    const seatTypesSeen = new Set();

    for (const rule of pricingRules) {
        if (rule.amountPkr == null || isNaN(Number(rule.amountPkr)) || Number(rule.amountPkr) <= 0) {
            throw ApiError.badRequest("Each pricing rule must have a valid positive PKR amount");
        }
        if (!validPricingTypes.includes(rule.type)) {
            throw ApiError.badRequest(`Invalid pricing type: ${rule.type}`);
        }
        if (rule.seatType && !validSeatTypes.includes(rule.seatType)) {
            throw ApiError.badRequest(`Invalid seat type: ${rule.seatType}`);
        }
        const key = rule.seatType ?? "__fallback__";
        if (seatTypesSeen.has(key)) {
            throw ApiError.badRequest("Duplicate pricing rules for the same seat type");
        }
        seatTypesSeen.add(key);
    }
};
