import express from "express";
import {
	oCreate,
	oDelete,
	oReadAll,
} from "../controllers/category.controller.js";

const router = express.Router();

router.post("/create", oCreate);
router.get("/readAll", oReadAll);
router.delete("/delete", oDelete);

export default router;
