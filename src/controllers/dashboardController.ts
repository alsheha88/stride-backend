import type { Request, Response } from "express";
import { prisma } from "../../prisma/lib/prisma.js";

export const getDashboard = async (req: Request, res: Response) => {
	const userId = req.user!.id;

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
};

export const getMostImproved = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const timerFrame = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;

	const concepts = await prisma.concept.findMany({
		where: {
			userId: userId,
		},
		include: {
			ratings: true,
		},
		orderBy: { createdAt: "asc" },
	});

	const recentRatings = concepts.filter((c) => {
		const diff = c.ratings.some((rating) => {
			return (
				new Date().getTime() - rating.createdAt.getTime() <=
				30 * 24 * 60 * 60 * 1000
			);
		});

		return diff;
	});
	const initialConceptsList = recentRatings.filter((c) => c.ratings.length > 1);
	const filteredConcepts = initialConceptsList.filter((c) => {
		return c.ratings.some((r) => r.createdAt.getTime() <= timerFrame);
	});
	const mostImprovedConcept = filteredConcepts.map((c) => {
		const rating = c.ratings.findLast((r) => {
			return r.createdAt.getTime() <= timerFrame;
		});
		const baselineRating = rating?.rating ?? 0;
		const latestRating = c.ratings[c.ratings.length - 1]?.rating ?? 0;
		const delta = latestRating - baselineRating;
		return {
			concept: c.name,
			latestRating: latestRating,
			baselineRating: baselineRating,
			delta: delta,
		};
	});

	const filterImprovedConcepts = mostImprovedConcept
		.filter((c) => c.delta > 0)
		.sort((a, b) => b.delta - a.delta)
		.slice(0, 5);

	res.json({ data: { mostImproved: filterImprovedConcepts } });
};

export const getWeeklyActivity = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const timerFrame = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;

	const [concepts, projects] = await Promise.all([
		prisma.conceptRating.count({
			where: {
				createdAt: {
					gt: new Date(timerFrame),
				},
				concept: {
					userId,
				},
			},
		}),

		prisma.project.count({
			where: {
				userId,
				status: "COMPLETED",
				completedAt: {
					gt: new Date(timerFrame),
				},
			},
		}),
	]);

	res.json({
		data: {
			conceptsRated: concepts,
			projectsCompleted: projects,
		},
	});
};

export const getActiveStreak = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const lookback = new Date();
	lookback.setDate(lookback.getDate() - 365);

	const [ratings, notes, concepts, projects] = await Promise.all([
		prisma.conceptRating.findMany({
			where: {
				concept: { userId },
				createdAt: {
					gt: lookback,
				},
			},
			select: {
				createdAt: true,
			},
		}),

		prisma.conceptNote.findMany({
			where: {
				concept: { userId },
				createdAt: {
					gt: lookback,
				},
			},
			select: {
				createdAt: true,
			},
		}),
		prisma.concept.findMany({
			where: {
				userId,
				createdAt: {
					gt: lookback,
				},
			},
			select: {
				createdAt: true,
			},
		}),

		prisma.project.findMany({
			where: {
				userId,
				status: "COMPLETED",
				completedAt: {
					gt: lookback,
				},
			},
			select: {
				completedAt: true,
			},
		}),
	]);
	const flat = [
		...concepts.map((c) => c.createdAt),
		...projects.map((p) => p.completedAt),
		...notes.map((n) => n.createdAt),
		...ratings.map((r) => r.createdAt),
	];
	const dates = flat.map((item) => {
		return item?.toISOString().split("T")[0];
	});
	const activeDays = new Set(dates);
	const cursor = new Date();
	const todayKey = cursor.toISOString().split("T")[0];

	if (!activeDays.has(todayKey)) {
		cursor.setDate(cursor.getDate() - 1);
	}
	let streak = 0;
	while (true) {
		const dayKey = cursor.toISOString().split("T")[0];
		if (activeDays.has(dayKey)) {
			streak++;
			cursor.setDate(cursor.getDate() - 1);
		} else {
			break;
		}
	}

	res.json({ data: { streak } });
};
