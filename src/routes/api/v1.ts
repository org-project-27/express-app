import express from 'express';
import userRouter from '#routes/api/v1/user';
import uploadRouter from "#routes/api/v1/upload";
import brandRouter from "#routes/api/v1/brand";
import placeRouter from "#routes/api/v1/place";
const router = express.Router();

router.use('/user', userRouter);
router.use('/upload', uploadRouter);
router.use('/brand', brandRouter);
router.use('/place', placeRouter);

export default router;