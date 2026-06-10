import express from "express";
import {
	createConceptNoteSchema,
	createConceptSchema,
	idParamsSchema,
	updateConceptSchema,
} from "../schema/conceptSchema.js";
import {
	ConflictError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "../errors/index.js";
import { prisma } from "../../prisma/lib/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
	const userId = req.user?.id;
	if (!userId) throw new UnauthorizedError("Unauthorized");

	const concepts = await prisma.concept.findMany({
		where: {
			userId: userId,
		},
		include: {
			ratings: {
				orderBy: { createdAt: "desc" },
				take: 1,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	res.status(200).json({ data: { concepts } });
});
router.get("/:id", async (req, res) => {
	const userId = req.user?.id;
	if (!userId) throw new UnauthorizedError("Unauthorized");
	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid concept ID", idResult.error.issues);

	const selectedConcept = await prisma.concept.findFirst({
		where: {
			userId: userId,
			id: idResult.data,
		},
		include: {
			ratings: {
				orderBy: { createdAt: "asc" },
			},
			notes: { orderBy: { createdAt: "asc" } },
			projectLinks: { include: { project: true } },
		},
	});

	if (!selectedConcept) throw new NotFoundError("Concept not found");

	res.status(200).json({ data: { concept: selectedConcept } });
});
router.post("/", async (req, res) => {
	const userId = req.user?.id;
	if (!userId) throw new UnauthorizedError("Unauthorized");
	const newConcept = createConceptSchema.safeParse(req.body);

	if (!newConcept.success) {
		throw new ValidationError(
			"Failed to validate concept data",
			newConcept.error.issues,
		);
	}
	const existingConcept = await prisma.concept.findUnique({
		where: {
			userId_name: {
				userId: userId,
				name: newConcept.data?.name,
			},
		},
	});

	if (existingConcept)
		throw new ConflictError("You already have a concept with this name");

	const concept = await prisma.concept.create({
		data: {
			name: newConcept.data.name,
			userId: userId,
			ratings: {
				create: {
					rating: newConcept.data.rating,
				},
			},
		},
		include: { ratings: true },
	});

	res.status(201).json({ data: { concept } });
});

router.post("/:id/notes", async (req, res) => {
	const userId = req.user?.id;
	if (!userId) throw new UnauthorizedError("Unauthorized");
	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid concept ID", idResult.error.issues);
	const newNote = createConceptNoteSchema.safeParse(req.body);
	if (!newNote.success)
		throw new ValidationError(
			"Failed to validate note entry",
			newNote.error.issues,
		);
	const concept = await prisma.concept.findFirst({
		where: { id: idResult.data, userId },
	});
	if (!concept) throw new NotFoundError("Concept not found");

	const note = await prisma.conceptNote.create({
		data: {
			content: newNote.data.note,
			conceptId: idResult.data,
		},
	});

	res.status(201).json({ data: { note } });
});
router.patch("/:id", async (req, res) => {
	const userId = req.user?.id;
	if (!userId) throw new UnauthorizedError("Unauthorized");

	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid concept ID", idResult.error.issues);

	const validateRequest = updateConceptSchema.safeParse(req.body);
	if (!validateRequest.success)
		throw new ValidationError(
			"Failed to validate concept data",
			validateRequest.error.issues,
		);

	const existingConcept = await prisma.concept.findFirst({
		where: { id: idResult.data, userId },
	});
	if (!existingConcept) throw new NotFoundError("Concept not found");

	if (validateRequest.data.name !== existingConcept.name) {
		const duplicate = await prisma.concept.findUnique({
			where: { userId_name: { userId, name: validateRequest.data.name } },
		});
		if (duplicate)
			throw new ConflictError("You already have a concept with this name");
	}

	const updatedConcept = await prisma.concept.update({
		where: { id: idResult.data },
		data: { name: validateRequest.data.name },
	});

	res.status(200).json({ data: { concept: updatedConcept } });
});
router.delete("/:id", async (req, res) => {
	const userId = req.user?.id;
	if (!userId) throw new UnauthorizedError("Unauthorized");

	const idResult = idParamsSchema.safeParse(req.params.id);
	if (!idResult.success)
		throw new ValidationError("Invalid concept ID", idResult.error.issues);

    const existingConcept = await prisma.concept.findFirst({
		where: { id: idResult.data, userId },
	});
	if (!existingConcept) throw new NotFoundError("Concept not found");

    await prisma.concept.delete({
        where: {
            id: idResult.data
        }
    })

    res.status(204).send();
});

export default router;
