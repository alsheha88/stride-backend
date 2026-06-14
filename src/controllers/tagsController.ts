import type { Request, Response } from "express";
import { prisma } from "../../prisma/lib/prisma.js";
import { idParamsSchema } from "../schema/conceptSchema.js";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { createTagSchema, editTagSchema } from "../schema/tagSchema.js";

export const getTags = async (req: Request, res: Response) => {
	const userId = req.user!.id;

	const tags = await prisma.tag.findMany({
		where: {
			userId,
		},
		include: {
			_count: {
				select: {
					conceptTags: true,
				},
			},
		},
		orderBy: { name: "asc" },
	});

	res.status(200).json({ data: { tags } });
};

export const addTag = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const validateRequest = createTagSchema.safeParse(req.body);

	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate tag data",
			validateRequest.error.issues,
		);
	const existingTag = await prisma.tag.findUnique({
		where: {
			userId_name: {
				userId,
				name: validateRequest.data.name,
			},
		},
	});
	if (existingTag) throw new ConflictError("This tag already exists");
	const newTag = await prisma.tag.create({
		data: {
			userId,
			name: validateRequest.data.name,
			color: validateRequest.data.color,
		},
	});

	res.status(201).json({ data: { tag: newTag } });
};
export const editTag = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid tag ID", idResult.error.issues);
	const validateRequest = editTagSchema.safeParse(req.body);
	const updateData: Record<string, unknown> = {};

	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate tag data",
			validateRequest.error.issues,
		);
	if (validateRequest.data.name !== undefined)
		updateData.name = validateRequest.data.name;
	if (validateRequest.data.color !== undefined)
		updateData.color = validateRequest.data.color;
	const existingTag = await prisma.tag.findFirst({
		where: {
			userId,
			id: idResult.data,
		},
	});

	if (!existingTag) throw new NotFoundError("Tag not found");

	if (
		validateRequest.data.name &&
		validateRequest.data.name !== existingTag.name
	) {
		const duplicate = await prisma.tag.findUnique({
			where: {
				userId_name: {
					userId,
					name: validateRequest.data.name,
				},
			},
		});
		if (duplicate)
			throw new ConflictError("You already have a tag with this name");
	}
	const updatedTag = await prisma.tag.update({
		where: {
			id: idResult.data,
			userId,
		},
		data: updateData,
	});

	res.status(200).json({ data: { tag: updatedTag } });
};

export const deleteTag = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid tag ID", idResult.error.issues);

	const existingTag = await prisma.tag.findFirst({
		where: {
			userId,
			id: idResult.data,
		},
	});
	if (!existingTag) throw new NotFoundError("Tag not found");

	await prisma.tag.delete({
		where: {
			id: idResult.data,
		},
	});

	res.status(204).send();
};
