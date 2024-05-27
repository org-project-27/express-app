import {NextFunction, Request, Response} from "express";
import dotenv from "dotenv";

dotenv.config();
export default (req: Request, res: Response, next: NextFunction) => {
    const secretKey = req.headers['x-secret-key'];

    if (!secretKey) {
        return res.status(401).json({ error: 'Service auth required' });
    }

    if (secretKey !== process.env.X_SECRET_KEY) {
        return res.status(403).json({ error: 'Invalid secret key' });
    }

    // If the secret key is valid, proceed to the next middleware or route handler
    next();
};