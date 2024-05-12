import express from 'express';
const router = express.Router();
import userController from "../../../controller/user/userController.js";
import { $authenticateToken } from '../../../assets/helpers/methods.js';


router.get('/auth',  $authenticateToken, userController);
router.get('/logout',  $authenticateToken, userController);
router.use('/', userController);

export default router;