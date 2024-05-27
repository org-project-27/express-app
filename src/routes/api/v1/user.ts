import express, { Request, Response } from 'express';
const router = express.Router();
import userController from "#controllers/userController";
import $authenticateToken from "~/middlewares/authenticateToken";

router.get('/auth',  $authenticateToken, userController);
router.get('/logout',  $authenticateToken, userController);
router.use('/', userController);
export default router;