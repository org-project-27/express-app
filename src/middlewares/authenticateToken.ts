import statusCodes from "#assets/constants/statusCodes";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
import {$verifyTokenSession} from "#helpers/jwt";
import {$sendResponse} from "#helpers/methods";
import {NextFunction, Request, Response} from "express";

export default async (req: Request, res: Response, next: NextFunction) => {
    // const authHeader = req.headers["authorization"];
    // const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    //
    // if (token == null) {
    //     return $sendResponse.failed(
    //         res,
    //         statusCodes.UNAUTHORIZED,
    //         apiMessageKeys.SOMETHING_WENT_WRONG
    //     );
    // }
    //
    // const {payload, session} = await $verifyTokenSession('access_token', token);
    // if (!payload) {
    //     return $sendResponse.failed(
    //         res,
    //         statusCodes.FORBIDDEN,
    //         apiMessageKeys.INVALID_TOKEN
    //     );
    // }
    // // @ts-ignore
    // req.headers["user_auth_id"] = payload.user_id;
    // req.headers["token_session"] = session;
    next();
};