import express from 'express';
import userRouter from './v1/user';
const router = express.Router();

export default router.use('/user', userRouter);