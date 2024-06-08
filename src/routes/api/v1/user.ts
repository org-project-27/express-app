import express, { Request, Response } from 'express';
const router = express.Router();
import UserController from "#controllers/UserController";
import $authenticateToken from "~/middlewares/authenticateToken";

router.get('/auth', $authenticateToken, UserController);
router.get('/logout', $authenticateToken, UserController);
router.put('/preferred_lang', $authenticateToken, UserController);
router.use('/', UserController);
export default router;