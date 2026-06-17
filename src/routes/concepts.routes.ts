import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
	addConcept,
	addConceptNote,
	deleteConcept,
	deleteConceptNote,
	editConcept,
	editConceptNote,
	getConcept,
	getConcepts,
} from "../controllers/conceptsController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConcepts);
router.get("/:id", getConcept);
router.post("/", addConcept);
router.post("/:id/notes", addConceptNote);
router.patch("/:id/notes/:noteId", editConceptNote);
router.delete("/:id/notes/:noteId", deleteConceptNote);
router.patch("/:id", editConcept);
router.delete("/:id", deleteConcept);

export default router;
