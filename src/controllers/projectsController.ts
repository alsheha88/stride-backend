import type { Request, Response } from "express";
import { prisma } from "../../prisma/lib/prisma.js";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { idParamsSchema } from "../schema/conceptSchema.js";
import {
	completeProjectSchema,
	createProjectSchema,
	lessonsLearntSchema,
	updateProjectSchema,
	updateProjectStatusSchema,
} from "../schema/projectsSchema.js";

export const getProjects = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const projects = await prisma.project.findMany({
		where: {
			userId: userId,
		},
		include: {
			conceptLinks: {
				include: { concept: { select: { id: true, name: true } } },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	res.status(200).json({ data: { projects } });
};
export const getProject = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid project ID", idResult.error.issues);

	const selectedProject = await prisma.project.findFirst({
		where: {
			userId: userId,
			id: idResult.data,
		},
		include: {
			conceptLinks: {
				include: {
					concept: {
						select: {
							name: true,
							id: true,
							ratings: { orderBy: { createdAt: "desc" }, take: 1 },
						},
					},
				},
			},
		},
	});

	if (!selectedProject) throw new NotFoundError("Project not found");

	res.status(200).json({ data: { project: selectedProject } });
};
export const addProject = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const validateRequest = createProjectSchema.safeParse(req.body);
	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate project data",
			validateRequest.error.issues,
		);

	const existingLinks = validateRequest.data.conceptLinks.filter((link) => {
		return link.type === "existing";
	});
	const newConceptInput = validateRequest.data.conceptLinks.filter((link) => {
		return link.type === "new";
	});
	const existingConceptIds = existingLinks.map((link) => link.conceptId);
	const newConceptNames = newConceptInput.map((concept) => concept.name);
	const duplicateConceptName = await prisma.concept.findMany({
		where: {
			userId,
			name: { in: newConceptNames },
		},
	});
	if (duplicateConceptName.length > 0)
		throw new ConflictError(
			"A concept with this name already exists, choose another name or add the exsiting concept",
		);
	const ownedConcepts = await prisma.concept.findMany({
		where: {
			userId,
			id: { in: existingConceptIds },
		},
		select: { id: true },
	});

	if (existingConceptIds.length !== ownedConcepts.length)
		throw new ValidationError("One or more concepts not found", []);

	const result = await prisma.$transaction(async (tx) => {
		const newConcept = await Promise.all(
			newConceptInput.map((item) => {
				return tx.concept.create({
					data: {
						userId,
						name: item.name,
						ratings: { create: { rating: item.initialRating } },
					},
				});
			}),
		);

		const allConceptIds = [
			...existingConceptIds,
			...newConcept.map((i) => i.id),
		];

		const project = await tx.project.create({
			data: {
				userId,
				name: validateRequest.data.name,
				description: validateRequest.data.description ?? null,
				evidenceUrl: validateRequest.data.evidenceUrl ?? null,
				conceptLinks: {
					create: allConceptIds.map((conceptId) => ({ conceptId })),
				},
			},
			include: {
				conceptLinks: {
					include: {
						concept: {
							select: {
								id: true,
								name: true,
								ratings: { orderBy: { createdAt: "desc" }, take: 1 },
							},
						},
					},
				},
			},
		});

		return project;
	});

	res.status(201).json({ data: { project: result } });
};
export const editProject = async (req: Request, res: Response) => {
	const userId = req.user!.id;

	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid Project ID", idResult.error.issues);

	const validateRequest = updateProjectSchema.safeParse(req.body);
	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate project data",
			validateRequest.error.issues,
		);

	const existingProject = await prisma.project.findFirst({
		where: { id: idResult.data, userId },
	});
	if (!existingProject) throw new NotFoundError("Project not found");

	if (
		validateRequest.data.name &&
		validateRequest.data.name !== existingProject.name
	) {
		const duplicate = await prisma.project.findFirst({
			where: { userId, name: validateRequest.data.name },
		});
		if (duplicate)
			throw new ConflictError("You already have a project with this name");
	}
	const updateData: Record<string, unknown> = {};
	if (validateRequest.data.name !== undefined)
		updateData.name = validateRequest.data.name;
	if (validateRequest.data.description !== undefined)
		updateData.description = validateRequest.data.description;
	if (validateRequest.data.evidenceUrl !== undefined)
		updateData.evidenceUrl = validateRequest.data.evidenceUrl;

	const updatedProject = await prisma.project.update({
		where: { id: idResult.data },
		data: updateData,
		include: {
			conceptLinks: {
				include: {
					concept: {
						select: {
							id: true,
							name: true,
							ratings: { orderBy: { createdAt: "desc" }, take: 1 },
						},
					},
				},
			},
		},
	});

	res.status(200).json({ data: { project: updatedProject } });
};
export const editProjectStatus = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid Project ID", idResult.error.issues);
	const validateRequest = updateProjectStatusSchema.safeParse(req.body);
	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate project status data",
			validateRequest.error.issues,
		);

	const existingProject = await prisma.project.findFirst({
		where: { id: idResult.data, userId },
	});
	if (!existingProject) throw new NotFoundError("Project not found");

	if (existingProject.status === "COMPLETED") {
		throw new ValidationError(
			"Cannot change status of a completed project",
			[],
		);
	}

	const updateProjectStatus = await prisma.project.update({
		where: { id: idResult.data },
		data: { status: validateRequest.data?.status },
	});

	res.status(200).json({ data: { project: updateProjectStatus } });
};
export const completeProject = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid project ID", idResult.error.issues);

	const validateRequest = completeProjectSchema.safeParse(req.body);
	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate project data",
			validateRequest.error.issues,
		);
	const selectedProject = await prisma.project.findFirst({
		where: {
			userId,
			id: idResult.data,
		},
		include: {
			conceptLinks: {
				include: {
					concept: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
	});
	if (!selectedProject) throw new NotFoundError("Project not found");

	if (selectedProject.status === "COMPLETED")
		throw new ConflictError("This project is already completed");
	if (selectedProject.conceptLinks.length === 0)
		throw new ValidationError("Project doesn't have any linked concepts", []);

	const projectIds = selectedProject.conceptLinks.map((l) => l.conceptId);
	const bodyIds = validateRequest.data.ratings.map((r) => r.conceptId);

	if (new Set(bodyIds).size !== bodyIds.length) {
		throw new ValidationError("Duplicate concept IDs in ratings", []);
	}

	if (
		projectIds.length !== bodyIds.length ||
		!bodyIds.every((id) => projectIds.includes(id))
	) {
		throw new ValidationError(
			"Ratings must cover exactly the project's linked concepts",
			[],
		);
	}

	const completeProject = await prisma.$transaction(async (tx) => {
		await Promise.all(
			validateRequest.data.ratings.map((item) => {
				return Promise.all([
					tx.conceptRating.create({
						data: {
							rating: item.rating,
							conceptId: item.conceptId,
							projectId: idResult.data,
						},
					}),
					tx.projectConcept.update({
						where: {
							projectId_conceptId: {
								projectId: idResult.data,
								conceptId: item.conceptId,
							},
						},
						data: {
							ratingAtCompletion: item.rating,
						},
					}),
				]);
			}),
		);

		const updatedProject = await tx.project.update({
			where: {
				id: idResult.data,
			},
			data: {
				completedAt: new Date(),
				status: "COMPLETED",
				lessonsLearned: validateRequest.data.lessonsLearned,
			},
			include: {
				conceptLinks: {
					include: {
						concept: {
							select: {
								id: true,
								name: true,
								ratings: { orderBy: { createdAt: "desc" }, take: 1 },
							},
						},
					},
				},
			},
		});

		return updatedProject;
	});

	res.status(200).json({ data: { project: completeProject } });
};

export const editProjectLessons = async (req: Request, res: Response) => {
	const userId = req.user!.id;

	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid Project ID", idResult.error.issues);
	const validateRequest = lessonsLearntSchema.safeParse(req.body);

	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate lessons learnt data",
			validateRequest.error.issues,
		);

	const existingProject = await prisma.project.findFirst({
		where: {
			id: idResult.data,
			userId,
		},
	});
	if (!existingProject) throw new NotFoundError("Project not found");

	const updateLessonsLearnt = await prisma.project.update({
		where: { id: idResult.data, userId },
		data: {
			lessonsLearned: validateRequest.data.lessonsLearned,
		},
	});

	res.status(200).json({ data: { lessonsLearn: updateLessonsLearnt } });
};
export const deleteProject = async (req: Request, res: Response) => {
	const userId = req.user!.id;

	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid project ID", idResult.error.issues);

	const existingProject = await prisma.project.findFirst({
		where: { id: idResult.data, userId },
	});
	if (!existingProject) throw new NotFoundError("Project not found");

	await prisma.project.delete({
		where: {
			id: idResult.data,
		},
	});

	res.status(204).send();
};
