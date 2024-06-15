import express, { Request, Response } from 'express';
const router = express.Router();
import $authenticateToken from "~/middlewares/authenticateToken";
import UploadController from "#controllers/UploadController";

router.use('/', $authenticateToken, UploadController());
export default router;