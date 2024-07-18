import express, { Request, Response } from 'express';
const router = express.Router();
import $authenticateToken from '~/middlewares/authenticateToken';
import BaseUploadController from '~/controllers/BaseUploadController';
import { $uploader } from '~/assets/helpers/methods';

router.use('/', $authenticateToken, $uploader(), BaseUploadController);
export default router;
