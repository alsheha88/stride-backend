import type { NextFunction, Response, Request } from "express";
import {
	AppError,
	ValidationError,
	ConflictError,
	NotFoundError,
	ForbiddenError,
	UnauthorizedError,
} from "../errors/index.js";

export function ErrorHandler(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	if (err instanceof ValidationError) {
		res.status(err.statusCode).json({
			error: { code: err.code, message: err.message, details: err.details },
		});

		return;
	}
	if (err instanceof AppError) {
		res
			.status(err.statusCode)
			.json({ error: { code: err.code, message: err.message } });

		return;
	}

	console.error(err);
	res.status(500).json({
		error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
	});
}
