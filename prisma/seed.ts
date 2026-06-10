import data from "./seed-data.json" with { type: "json" };
import { prisma } from "./lib/prisma.js";
import { hashPassword } from "../utility.js";
import type { ProjectStatus } from "../generated/prisma/enums.js";

async function main() {
	const seedUserPassword = await hashPassword("password123");

	const userData = data.users[0];
	if (!userData) throw new Error("Seed data must contain at least one user");

	await prisma.user.deleteMany();
	console.log("✓ Cleared existing data");

	await prisma.user.create({
		data: {
			id: userData.id,
			name: userData.name,
			passwordHash: seedUserPassword,
			email: userData.email,
			emailVerifiedAt: userData.emailVerifiedAt,
		},
	});
	console.log(`✓ Created user: ${userData.email}`);

	const concepts = data.concepts.map((concept) => ({
		id: concept.id,
		name: concept.name,
		userId: concept.userId,
		createdAt: new Date(concept.createdAt),
	}));
	await prisma.concept.createMany({
		data: concepts,
	});
	console.log(`✓ Inserted ${concepts.length} concepts`);
	const projects = data.projects.map((project) => ({
		id: project.id,
		name: project.name,
		description: project.description,
		lessonsLearned: project.lessonsLearned,
		status: project.status as ProjectStatus,
		evidenceUrl: project.evidenceUrl,
		createdAt: new Date(project.createdAt),
		completedAt: project.completedAt,
		userId: project.userId,
	}));
	await prisma.project.createMany({
		data: projects,
	});
	console.log(`✓ Inserted ${projects.length} projects`);

	const projectConcepts = data.projectConcepts.map((item) => ({
		projectId: item.projectId,
		conceptId: item.conceptId,
		ratingAtCompletion: item.ratingAtCompletion,
	}));
	await prisma.projectConcept.createMany({
		data: projectConcepts,
	});
	console.log(`✓ Inserted ${projectConcepts.length} project-concept links`);

	const conceptRatings = data.conceptRatings.map((item) => ({
		id: item.id,
		rating: item.rating,
		createdAt: new Date(item.createdAt),
		conceptId: item.conceptId,
	}));
	await prisma.conceptRating.createMany({
		data: conceptRatings,
	});
	console.log(`✓ Inserted ${conceptRatings.length} concept ratings`);

	const conceptNotes = data.conceptNotes.map((item) => ({
		id: item.id,
		content: item.content,
		conceptId: item.conceptId,
		createdAt: new Date(item.createdAt),
	}));
	await prisma.conceptNote.createMany({ data: conceptNotes });
	console.log(`✓ Inserted ${conceptNotes.length} concept notes`);

	console.log("\n✓ Seed complete");
}

try {
	await main();
} catch (e) {
	console.error(e);
	process.exit(1);
} finally {
	await prisma.$disconnect();
}
