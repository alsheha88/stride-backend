import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { addTag, deleteTag, editTag, getTags } from "../controllers/tagsController.js";



const router = express.Router();

router.use(authMiddleware);

router.get("/", getTags)
router.post("/add", addTag)
router.patch("/:id", editTag)
router.delete("/:id", deleteTag)

export default router;