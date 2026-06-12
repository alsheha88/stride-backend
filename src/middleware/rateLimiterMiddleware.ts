import { rateLimit } from "express-rate-limit";

export const createAuthLimiter = (limit: number) =>
	rateLimit({
		windowMs: 15 * 60 * 1000,
		limit,
		standardHeaders: true,
		legacyHeaders: false,
		ipv6Subnet: 56,
		message: {
			message: "Too many requests. Please wait a few minutes and try again.",
		},
	});
