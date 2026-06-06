export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;

    next(error);
};

export const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV !== "production" && {
            stack: err.stack,
        }),
    });
};


export class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);

        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad Request") {
        return new ApiError(message, 400);
    }

    static unauthorized(message = "Unauthorized") {
        return new ApiError(message, 401);
    }

    static forbidden(message = "Forbidden") {
        return new ApiError(message, 403);
    }

    static notFound(message = "Resource not found") {
        return new ApiError(message, 404);
    }

    static conflict(message = "Conflict") {
        return new ApiError(message, 409);
    }
}
