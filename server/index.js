import "dotenv/config.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";

import { generalLimiter } from "./src/utils/rate-limiter.js";
import { globalErrorHandler, notFoundHandler } from "./src/utils/error.js";
import authRouter from "./src/routes/auth.router.js";
import emailRouter from "./src/routes/email.router.js";
import userRouter from "./src/routes/user.router.js";
import cinemaRouter from "./src/routes/cinema.router.js";
import screenRouter from "./src/routes/screen.router.js";
import movieRouter from "./src/routes/movie.router.js";
import genreRouter from "./src/routes/genre.routes.js";
import showRouter from "./src/routes/show.router.js";
import seatRouter from "./src/routes/seat.router.js";
import couponRouter from "./src/routes/coupon.router.js";
import bookingRouter from "./src/routes/booking.routes.js";
import ticketRouter from "./src/routes/ticket.routes.js";
import { paymentRouter, webhookRouter } from "./src/routes/payment.router.js";
import analyticsRouter from "./src/routes/analytics.router.js";
import enumRouter from "./src/routes/enum.router.js";
import reviewRouter from "./src/routes/review.router.js";
import contactRouter from "./src/routes/contact.router.js";

const app = express();
const PORT = process.env.PORT || 8000;
export const API_VERSION = process.env.API_VERSION || "/api/v1";

// Environment variable checks
if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error("JWT_ACCESS_SECRET is required");
    }

    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is required");
    }
}

// trust proxy
app.set("trust proxy", 1);

// security headers
app.use(helmet());

// compression
app.use(compression());

app.use(`${API_VERSION}/payments`, webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? process.env.CORS_ORIGIN : "http://localhost:3000",
        credentials: true,
    })
);

// rate limiting
app.use(generalLimiter);

// health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use(`${API_VERSION}/auth`, authRouter);
app.use(`${API_VERSION}/email`, emailRouter);
app.use(`${API_VERSION}/users`, userRouter);
app.use(`${API_VERSION}/cinemas`, cinemaRouter);
app.use(`${API_VERSION}/screens`, screenRouter);
app.use(`${API_VERSION}/movies`, movieRouter);
app.use(`${API_VERSION}/genres`, genreRouter);
app.use(`${API_VERSION}/shows`, showRouter);
app.use(`${API_VERSION}/seats`, seatRouter);
app.use(`${API_VERSION}/coupons`, couponRouter);
app.use(`${API_VERSION}/reviews`, reviewRouter);
app.use(`${API_VERSION}/bookings`, bookingRouter);
app.use(`${API_VERSION}/payments`, paymentRouter);
app.use(`${API_VERSION}/tickets`, ticketRouter);
app.use(`${API_VERSION}/analytics`, analyticsRouter);
app.use(`${API_VERSION}/enums`, enumRouter);
app.use(`${API_VERSION}/contact`, contactRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
