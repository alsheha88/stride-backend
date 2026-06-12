import express from "express";
import {
	loginSchema,
	signUpSchema,
	verifyEmailSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} from "../schema/authSchema.js";
import {
	ConflictError,
	UnauthorizedError,
	ValidationError,
} from "../errors/index.js";
import { prisma } from "../../prisma/lib/prisma.js";
import {
	generateRawToken,
	hashPassword,
	hashToken,
	signAccessToken,
	verifyPassword,
} from "../../utility.js";
import { sendEmail } from "../lib/email.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createAuthLimiter } from "../middleware/rateLimiterMiddleware.js";
import { env } from "../lib/env.js";

const router = express.Router();

const loginLimiter = createAuthLimiter(5);
const signupLimiter = createAuthLimiter(3);
const verifyEmailLimiter = createAuthLimiter(10);
const resetPasswordLimiter = createAuthLimiter(5);
const forgotPasswordLimiter = createAuthLimiter(3);


router.post("/signup", signupLimiter ,async (req, res) => {
	const validateRequest = signUpSchema.safeParse(req.body); // safeParse used so that error is handled through the error handling middleware
	if (!validateRequest.success) {
		throw new ValidationError(
			"Failed to validate user data",
			validateRequest.error.issues,
		);
	}
	const { name, email, password } = validateRequest.data;
	const duplicateUser = await prisma.user.findUnique({
		where: {
			email: email.toLowerCase(),
		},
	});
	if (duplicateUser) {
		throw new ConflictError("This email already exists! try to login");
	}
	const hashedPassword = await hashPassword(password);

	const newUser = await prisma.user.create({
		data: {
			name: name,
			passwordHash: hashedPassword,
			email: email.toLowerCase(),
		},
	});
	const rawToken = generateRawToken();
	const tokenHash = hashToken(rawToken);
	await prisma.emailVerificationToken.create({
		data: {
			userId: newUser.id,
			tokenHash: tokenHash,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		},
	});
	const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}`;

	await sendEmail({
		to: email,
		subject: "Verify your email for Stride",
		html: `<p>Click the link to verify your email:</p><a href="${verifyUrl}">Verify email</a>`,
	});

	res.status(201).json({
		data: {
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
			},
		},
		message: "Account created. Please check your email to verify your account.",
	});
});

router.post("/login", loginLimiter ,async (req, res) => {
	const validateRequest = loginSchema.safeParse(req.body); // safeParse used so that error is handled through the error handling middleware
	if (!validateRequest.success) {
		throw new ValidationError(
			"Failed to validate user data",
			validateRequest.error.issues,
		);
	}
	const { email, password } = validateRequest.data;
	const foundUser = await prisma.user.findUnique({
		where: {
			email: email.toLowerCase(),
		},
	});
	if (!foundUser) {
		throw new UnauthorizedError("Invalid email or password");
	}

	const passwordVerified = await verifyPassword(
		password,
		foundUser.passwordHash,
	);

	if (!passwordVerified) {
		throw new UnauthorizedError("Invalid email or password");
	}
	if (!foundUser.emailVerifiedAt) {
		throw new UnauthorizedError("Please verify your email first");
	}

	const accessToken = signAccessToken({ userId: foundUser.id });

	const rawToken = generateRawToken();
	const tokenHash = hashToken(rawToken);

	res.cookie("refreshToken", rawToken, {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: env.NODE_ENV === "production" ? "none" : "strict",
		maxAge: 30 * 24 * 60 * 60 * 1000,
	});

	await prisma.session.create({
		data: {
			userId: foundUser.id,
			tokenHash: tokenHash,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		},
	});
	res.status(200).json({
		data: {
			user: {
				id: foundUser.id,
				name: foundUser.name,
				email: foundUser.email,
			},
			accessToken: accessToken,
		},
		message: "Login Successful",
	});
});

router.post("/refresh", async (req, res) => {
	const refreshToken = req.cookies.refreshToken;
	if (!refreshToken) throw new UnauthorizedError("No token provided");

	const token = hashToken(refreshToken);

	const sessionToken = await prisma.session.findFirst({
		where: {
			tokenHash: token,
		},
	});
	if (!sessionToken) throw new UnauthorizedError("Invalid refresh token");
	if (sessionToken.expiresAt < new Date())
		throw new UnauthorizedError("Refresh token expired");
	if (sessionToken.revokedAt)
		throw new UnauthorizedError("Refresh token has been revoked");

	const newAccessToken = signAccessToken({ userId: sessionToken.userId });

	res.status(200).json({
		data: {
			accessToken: newAccessToken,
		},
		message: "Token refreshed",
	});
});

router.post("/logout", async (req, res) => {
	const refreshToken = req.cookies.refreshToken;

	if (refreshToken) {
		const tokenHashed = hashToken(refreshToken);
		await prisma.session.updateMany({
			where: { tokenHash: tokenHashed, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}

	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: env.NODE_ENV === "production" ? "none" : "strict",
	});

	res.status(200).json({ message: "Logged out successfully" });
});

router.post("/verify-email",verifyEmailLimiter ,async (req, res) => {
	const validateRequest = verifyEmailSchema.safeParse(req.body);

	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate token",
			validateRequest.error.issues,
		);

	const token = hashToken(validateRequest.data.token);

	const existingToken = await prisma.emailVerificationToken.findFirst({
		where: {
			tokenHash: token,
		},
	});
	if (
		!existingToken ||
		existingToken.expiresAt < new Date() ||
		existingToken.usedAt
	)
		throw new UnauthorizedError("Invalid or expired token");

	await prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: {
				id: existingToken.userId,
			},
			data: {
				emailVerifiedAt: new Date(),
			},
		});

		await tx.emailVerificationToken.update({
			where: {
				id: existingToken.id,
			},
			data: {
				usedAt: new Date(),
			},
		});
	});

	res.status(200).json({ message: "Email is verified successfully" });
});

router.post("/forgot-password", forgotPasswordLimiter ,async (req, res) => {
	const validateRequest = forgotPasswordSchema.safeParse(req.body);

	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate email",
			validateRequest.error.issues,
		);
	const user = await prisma.user.findFirst({
		where: {
			email: validateRequest.data.email.toLowerCase(),
		},
	});
	if (!user)
		return res.status(200).json({
			message:
				"If an account exists with that email, a password reset link has been sent.",
		});

	const rawToken = generateRawToken();
	const tokenHash = hashToken(rawToken);

	await prisma.passwordResetToken.create({
		data: {
			userId: user.id,
			tokenHash: tokenHash,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60),
		},
	});

	const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;

	await sendEmail({
		to: validateRequest.data.email.toLowerCase(),
		subject: "Reset password",
		html: `<p>You requested a password reset for your Stride account.</p>
				<p><a href="${resetUrl}">Reset your password</a></p>
				<p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
	});

	res.status(200).json({
		message:
			"If an account exists with that email, a password reset link has been sent.",
	});
});

router.post("/reset-password", resetPasswordLimiter ,async (req, res) => {
	const validateRequest = resetPasswordSchema.safeParse(req.body);

	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate token",
			validateRequest.error.issues,
		);

	const token = hashToken(validateRequest.data.token);
	const existingToken = await prisma.passwordResetToken.findFirst({
		where: {
			tokenHash: token,
		},
	});
	if (
		!existingToken ||
		existingToken.expiresAt < new Date() ||
		existingToken.usedAt
	)
		throw new UnauthorizedError("Invalid or expired token");

	const newPassword = await hashPassword(validateRequest.data.password);

	await prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: {
				id: existingToken.userId,
			},
			data: {
				passwordHash: newPassword,
				
			},
		});

		await tx.passwordResetToken.update({
			where: {
				id: existingToken.id,
			},
			data: {
				usedAt: new Date(),
				
			},
		});

		await tx.session.updateMany({
			where: {
				userId: existingToken.userId,
				revokedAt: null
			},
			data: {
				revokedAt: new Date(),
			}
		})
	});

	res.status(200).json({ message: "Password reset successfully" });
});

router.get("/me", authMiddleware, async (req, res) => {
	const user = await prisma.user.findUnique({
		where: { id: req.user!.id },
		select: {
			id: true,
			name: true,
			email: true,
			emailVerifiedAt: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	res.status(200).json({ data: { user } });
});
router.delete("/me", authMiddleware, async (req, res) => {
	await prisma.user.delete({
		where: { id: req.user!.id },
	});

	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: env.NODE_ENV === "production" ? "none" : "strict",
	});

	res.status(200).json({ message: "Account deleted" });
});
export default router;
