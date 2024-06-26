import express, { Request, Response } from 'express';
const router = express.Router();
import $authenticateToken from '~/middlewares/authenticateToken';
import UploadController, { uploader } from '#controllers/UploadController';

router.use('/', $authenticateToken, uploader, UploadController);
export default router;
