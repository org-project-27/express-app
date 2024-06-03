import statusCodes from "#assets/constants/statusCodes";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
import {$sendResponse} from "#helpers/methods";
import {NextFunction, Request, Response} from "express";
import TokenSessionController from "#controllers/TokenSessionController";
import {JwtPayload} from "jsonwebtoken";

export default async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    const sessions = new TokenSessionController(req, res);

    if (token == null) {
        return $sendResponse.failed(
            {},
            res,
            apiMessageKeys.SOMETHING_WENT_WRONG,
            statusCodes.UNAUTHORIZED,
        );
    }

    const result = await sessions.verify('access_token', token);


    if (!result) {
        return $sendResponse.failed(
            {},
            res,
            apiMessageKeys.INVALID_TOKEN,
            statusCodes.FORBIDDEN,
        );
    }
    req.body['authentication_result'] = JSON.stringify(result);
    next();
};