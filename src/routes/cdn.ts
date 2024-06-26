import express from 'express';
import ObjectController from '~/controllers/cdn/ObjectController';
import $authenticateToken from '~/middlewares/authenticateToken';

const router = express.Router();
export default router.use('/:id', ObjectController);
