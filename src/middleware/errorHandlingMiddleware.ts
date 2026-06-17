import type { NextFunction, Response, Request } from "express";
import {
	AppError,
	ValidationError,
} from "../errors/index.js";
import { logger } from "../lib/logger.js";

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

	logger.error(err);
	res.status(500).json({
		error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
	});
}
