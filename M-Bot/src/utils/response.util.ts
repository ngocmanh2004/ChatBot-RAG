import type { Response } from 'express';

const successResponse = (res: Response, statusCode: number, result?: unknown) => {
    return res.status(statusCode).json({
        statusCode,
        isSuccess: true,
        result
    });
};

const errorResponse = (res: Response, statusCode: number, error: string, message: string) => {
    return res.status(statusCode).json({
        statusCode,
        isSuccess: false,
        error,
        message
    });
};

export { successResponse, errorResponse };