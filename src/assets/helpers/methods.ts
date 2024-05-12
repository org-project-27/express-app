import statusCodes from "./statusCodes";
import createError from "http-errors";
import dotenv from "dotenv";
import apiMessageKeys from "../constants/apiMessageKeys";
import jwt from "jsonwebtoken";
import {$verifyTokenSession} from "./jwt";

dotenv.config();
let responseDelay: number = Number(process.env.RESPONSE_DELAY || 0);

export const $sendResponse = {
  success: (
    via: any,
    statusCode = statusCodes.OK,
    message = apiMessageKeys.DONE,
    others = {}
  ) => {
    const tId = setTimeout(() => {
      via.status(statusCode).send({ success: true, message, ...others });
      clearTimeout(tId);
    }, responseDelay);
  },
  failed: (
    via: any,
    statusCode = statusCodes.BAD_REQUEST,
    message = apiMessageKeys.SOMETHING_WENT_WRONG,
    others = {}
  ) => {
    const tId = setTimeout(() => {
      via.status(statusCode).send({ success: false, message, ...others });
      clearTimeout(tId);
    }, responseDelay);
  },
};

export const $callToAction = (actions: any) => {
  return (req: any, res: any, next: any) => {
    if (!!actions && !!req && !!res) {
      const { method, path } = req;
      if (actions[method] && actions[method][path]) {
        actions[method][path](req, res, next);
      } else {
        next(createError(statusCodes.NOT_FOUND));
      }
    } else {
      next(createError(statusCodes.INTERNAL_SERVER_ERROR));
    }
  };
};

export const $authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) {
    return $sendResponse.failed(
      res,
      statusCodes.UNAUTHORIZED,
      apiMessageKeys.SOMETHING_WENT_WRONG
    );
  }

  const {payload, session} = await $verifyTokenSession('access_token', token);
  if (!payload) {
    return $sendResponse.failed(
        res,
        statusCodes.FORBIDDEN,
        apiMessageKeys.INVALID_TOKEN
    );
  }
  // @ts-ignore
  req["user_auth_id"] = payload.user_id;
  req["token_session"] = session;
  next();
};

export const $filterObject = (target: object, filters:Array<string>, options: any = { reverse: false }) => {
  const filteredObject: any = {};
  Object.entries(target).forEach(([key, value]) => {
    if(options.reverse){
      if(!filters.includes(key)){
        filteredObject[key] = value;
      }
    } else {
      if(filters.includes(key)){
        filteredObject[key] = value;
      }
    }
  });
  return filteredObject;
}