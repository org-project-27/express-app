import express from 'express';
import UserController from "#controllers/UserController";
import $authenticateToken from "~/middlewares/authenticateToken";
import { $uploader } from '~/assets/helpers/methods';

const router = express.Router();

router.get('/auth', $authenticateToken, UserController);
router.get('/logout', $authenticateToken, UserController);
router.patch('/preferred_lang', $authenticateToken, UserController);
router.patch('/edit', $authenticateToken, UserController);
router.post('/profile_photo', $authenticateToken, $uploader('profile_photo'), UserController);
router.use('/', UserController);

export default router;