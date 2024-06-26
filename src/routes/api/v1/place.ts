import express from "express";
import $authenticateToken from "~/middlewares/authenticateToken";
import PlacesListController from "#controllers/PlacesListController";
const router = express.Router();

router.get('/all', PlacesListController);
router.get('/', PlacesListController);

router.use('/', $authenticateToken, PlacesListController);

export default router;