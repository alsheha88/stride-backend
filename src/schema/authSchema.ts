import { z } from "zod";

const passwordField = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(64, "Password must be at most 64 characters");

const emailField = z.email().min(1, "Email is required");

export const signUpSchema = z.object({
	name: z.string().min(1, "Full name is required"),
	email: emailField,
	password: passwordField,
});

export const loginSchema = z.object({
	email: emailField,
	password: passwordField,
});

export const verifyEmailSchema = z.object({
	token: z.string().min(1),
});
export const forgotPasswordSchema = z.object({
	email: emailField,
});

export const resetPasswordSchema = z.object({
	token: z.string().min(1),
	password: passwordField,
});



export type SignUpData = z.infer<typeof signUpSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type verifyEmailToken = z.infer<typeof verifyEmailSchema>;
export type resetPasswordData = z.infer<typeof resetPasswordSchema>;
