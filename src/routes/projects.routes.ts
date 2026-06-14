import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
	addProject,
	completeProject,
	deleteProject,
	editProject,
	getProject,
	getProjects,
} from "../controllers/projectsController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", addProject);

router.post("/:id/complete", completeProject);
router.patch("/:id", editProject);
router.delete("/:id", deleteProject);

export default router;
