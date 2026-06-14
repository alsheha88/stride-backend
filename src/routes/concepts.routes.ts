import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { addConcept, addConceptNote, deleteConcept, editConcept, getConcept, getConcepts } from "../controllers/conceptsController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConcepts);
router.get("/:id", getConcept);
router.post("/", addConcept);
router.post("/:id/notes", addConceptNote);
router.patch("/:id", editConcept);
router.delete("/:id", deleteConcept);

export default router;
