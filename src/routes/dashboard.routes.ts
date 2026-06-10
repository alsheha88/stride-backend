import express from "express";
import { UnauthorizedError } from "../errors/index.js";
import { prisma } from "../../prisma/lib/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
	const userId = req.user?.id;
	if (!userId) throw new UnauthorizedError("Unauthorized");

	const [concepts, projectsCompleted, recentProjects] = await Promise.all([
		prisma.concept.findMany({
			where: { userId },
			include: { ratings: { orderBy: { createdAt: "desc" }, take: 1 } },
			orderBy: { createdAt: "desc" },
		}),

		prisma.project.count({
			where: {
				userId,
				status: "COMPLETED",
			},
		}),

		prisma.project.findMany({
			where: {
				userId,
			},
			orderBy: { createdAt: "desc" },
			include: {
				conceptLinks: {
					include: {
						concept: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			take: 5,
		}),
	]);

	const masteredCount = concepts.filter(
		(c) => c.ratings[0]?.rating === 5,
	).length;
	const confidenceOverview = [...concepts].sort(
		(a, b) => (a.ratings[0]?.rating ?? 0) - (b.ratings[0]?.rating ?? 0),
	);
	const recentConcepts = concepts.slice(0, 5);

	res.status(200).json({
		data: {
			stats: {
				conceptsMastered: { current: masteredCount, total: concepts.length },
				projectsCompleted: projectsCompleted,
			},
			confidenceOverview,
			recentConcepts,
			recentProjects,
		},
	});
});

export default router;
