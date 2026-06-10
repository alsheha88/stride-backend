import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/index.js";
import { verifyAccessToken } from "../../utility.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new UnauthorizedError("No token provided");
	}

	const token = authHeader.slice(7); // remove "Bearer " prefix

	const payload = verifyAccessToken(token);

	req.user = { id: payload.userId };

	next();
}

