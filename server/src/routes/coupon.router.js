import express from "express";
import {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    updateCouponStatus,
    deleteCoupon,
    applyCoupon,
    removeCoupon,
    getCouponUsages,
} from "../controllers/coupon.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const couponRouter = express.Router();

couponRouter.get("/:id", getCouponById);

couponRouter.post(
    "/apply",
    verifyUser,
    requirePermissions("coupon:apply"),
    applyCoupon
);

couponRouter.delete(
    "/remove",
    verifyUser,
    requirePermissions("coupon:apply"),
    removeCoupon
);

couponRouter.get(
    "/",
    verifyUser,
    requirePermissions("coupon:list"),
    getAllCoupons
);

couponRouter.get(
    "/:couponId/usages",
    verifyUser,
    requirePermissions("coupon:read"),
    getCouponUsages
);

couponRouter.post(
    "/",
    verifyUser,
    requirePermissions("coupon:create"),
    createCoupon
);

couponRouter.patch(
    "/:id",
    verifyUser,
    requirePermissions("coupon:update"),
    updateCoupon
);

couponRouter.patch(
    "/:id/status",
    verifyUser,
    requirePermissions("coupon:toggle-active"),
    updateCouponStatus
);

couponRouter.delete(
    "/:id",
    verifyUser,
    requirePermissions("coupon:delete"),
    deleteCoupon
);

export default couponRouter;
