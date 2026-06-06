import rateLimit from "express-rate-limit";

const rateLimitHandler = (req, res) => {
    res.status(429).json({
        success: false,
        statusCode: 429,
        message: "Too many requests. Please try again later.",
    });
};

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: rateLimitHandler,
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});
