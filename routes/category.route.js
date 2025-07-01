import express from "express";
import {
	oCreate,
	oDelete,
	oReadAll,
} from "../controllers/category.controller.js";
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.post("/create", authorize('createCategory'), oCreate);
router.get("/readAll", authorize('readAllCategories'), oReadAll);
router.delete("/delete", authorize('deleteCategory'), oDelete);

export default router;
