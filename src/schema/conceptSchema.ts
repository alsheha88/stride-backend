import { z } from "zod";



export const createConceptSchema = z.object({
	name: z.string().min(1, "Name field cannot be empty"),
	rating: z.coerce.number().int().min(1).max(5),
	tagIds: z.array(z.uuid()).optional()
});
export const updateConceptSchema = z.object({
	name: z.string().min(1, "Name field cannot be empty"),
	tagIds: z.array(z.uuid()).optional()
});

export const idParamsSchema = z.string().uuid();

export const createConceptNoteSchema = z.object({
	note: z.string().min(1, "noted filed cannot be empty").max(280),
});

export type createConceptData = z.infer<typeof createConceptSchema>;
export type idParamsType = z.infer<typeof idParamsSchema>;
export type updateConceptData = z.infer<typeof updateConceptSchema>;
export type createConceptNoteData = z.infer<typeof createConceptNoteSchema>;
