import express from 'express';
const router = express.Router();
import userController from "../../../controller/user/userController";
import { $authenticateToken } from '../../../assets/helpers/methods';


router.get('/auth',  $authenticateToken, userController);
router.get('/logout',  $authenticateToken, userController);
router.use('/', userController);

export default router;