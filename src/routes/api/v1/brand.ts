import express from "express";
import $authenticateToken from "~/middlewares/authenticateToken";
import BrandController from "#controllers/BrandController";
const router = express.Router();

router.get('/all', BrandController);
router.use('/', $authenticateToken, BrandController);

export default router;