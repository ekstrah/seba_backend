import express from "express";
import { oCreate, oGetAll} from "../controllers/product.controller.js";
const router = express.Router();

router.post("/create", oCreate);
router.get("/getAll", oGetAll);



export default router;