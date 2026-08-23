class ApiError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }

    static badRequest(message = "Bad Request") {
        return new ApiError(400, message);
    }

    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }

    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }

    static notFound(message = "Resource not found") {
        return new ApiError(404, message);
    }

    static conflict(message = "Conflict") {
        return new ApiError(409, message);
    }

    static unprocessableEntity(message = "Validation failed") {
        return new ApiError(422, message);
    }

    static tooManyRequests(message = "Too many requests") {
        return new ApiError(429, message);
    }

    static internalServerError(message = "Internal Server Error") {
        return new ApiError(500, message);
    }

    static serviceUnavailable(message = "Service Unavailable") {
        return new ApiError(503, message);
    }
}

export { ApiError };