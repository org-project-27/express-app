import express from "express";
import v1Router from './api/v1.js';
const router = express.Router();
export default router.use('/v1', v1Router);