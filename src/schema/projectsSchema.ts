import { z } from "zod";

const conceptLinkSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("existing"),
		conceptId: z.uuid(),
	}),
	z.object({
		type: z.literal("new"),
		name: z.string().min(1).max(100),
		initialRating: z.number().int().min(1).max(5),
	}),
]);

export const createProjectSchema = z.object({
	name: z.string().min(1, "Name field cannot be empty"),
	description: z.string().max(500).optional(),
	evidenceUrl: z.string().optional(),
	conceptLinks: z.array(conceptLinkSchema),
});
export const updateProjectSchema = z.object({
	name: z.string().min(1, "Name field cannot be empty"),
	description: z.string().max(500).optional(),
	evidenceUrl: z.string().optional(),
});


export const completeProjectSchema = z.object({
	lessonsLearned: z.string().min(1).max(2000),
	ratings: z
		.array(
			z.object({
				conceptId: z.uuid(),
				rating: z.number().int().min(1).max(5),
			}),
		)
		.min(1, "Must provide ratings for all linked concepts"),
});

export const lessonsLearntSchema = z.object({
	lessonsLearned: z.string().min(1).max(2000),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS"]),
});

export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type completeProjectData = z.infer<typeof completeProjectSchema>;
export type LessonsLearntData = z.infer<typeof lessonsLearntSchema>;
