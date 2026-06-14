import { z } from "zod";

export const createTagSchema = z.object({
	name: z.string().min(1, "name cannot be empty").max(50),
	color: z.enum([
		"#ff8906",
		"#e94560",
		"#a7ff83",
		"#3da9fc",
		"#7b61ff",
		"#ffd93d",
	]),
});
export const editTagSchema = z.object({
	name: z.string().min(1, "name cannot be empty").max(50).optional(),
	color: z.enum([
		"#ff8906",
		"#e94560",
		"#a7ff83",
		"#3da9fc",
		"#7b61ff",
		"#ffd93d",
	]).optional(),
});

export type createTagData = z.infer<typeof createTagSchema>;
export type editTagData = z.infer<typeof editTagSchema>;
