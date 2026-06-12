import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./src/errors/index.js";
import crypto from "crypto";
import { env } from "./src/lib/env.js";

export async function hashPassword(password: string): Promise<string> {
	const saltRounds = Number(env.SALT_ROUNDS);

	const hashedPassword = await bcrypt.hash(password, saltRounds);

	return hashedPassword;
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export type AccessTokenPayload = {
	userId: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
	const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});
	return accessToken;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	const accessTokenSecret = env.ACCESS_TOKEN_SECRET;
	if (!accessTokenSecret) {
		throw new Error("ACCESS_TOKEN_SECRET is not defined");
	}
	try {
		return jwt.verify(token, accessTokenSecret) as AccessTokenPayload;
	} catch (_err) {
		throw new UnauthorizedError("Invalid or expired token");
	}
}

export function generateRawToken(): string {
	return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
	return crypto.createHash("sha256").update(rawToken).digest("hex");
}
