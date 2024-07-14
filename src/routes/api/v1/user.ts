import express, { Request, Response } from 'express';
import UserController from "#controllers/UserController";
import $authenticateToken from "~/middlewares/authenticateToken";

const router = express.Router();

router.get('/auth', $authenticateToken, UserController);
router.get('/logout', $authenticateToken, UserController);
router.patch('/preferred_lang', $authenticateToken, UserController);
router.patch('/edit', $authenticateToken, UserController);
router.use('/', UserController);

export default router;