export const asyncHandler = (fn) => {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};

export function apiResponse(res, statusCode, successStatus, message, data = null) {
    res.status(statusCode).json({
        success: successStatus,
        message,
        data,
    });
}