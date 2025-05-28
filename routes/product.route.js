import express from "express";
import { oCreate, oGetAll, oFind} from "../controllers/product.controller.js";
const router = express.Router();

router.post("/create", oCreate);
router.get("/getAll", oGetAll);
router.get("/find", oFind);

export default router;