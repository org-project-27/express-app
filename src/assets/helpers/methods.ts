import statusCodes from "../constants/statusCodes";
import createError from "http-errors";
import dotenv from "dotenv";
import apiMessageKeys from "../constants/apiMessageKeys";
import { Request, Response, NextFunction } from 'express';

dotenv.config();
let responseDelay: number = Number(process.env.RESPONSE_DELAY || 0);

export const $sendResponse = {
  success: (
    data = {},
    via: Response,
    message = apiMessageKeys.DONE,
    statusCode = statusCodes.OK,
    other = {}
  ) => {
    const tId = setTimeout(() => {
      via.status(statusCode).send({ success: true, message, data, ...other });
      clearTimeout(tId);
    }, responseDelay);
  },
  failed: (
    data = {},
    via: Response,
    message = apiMessageKeys.SOMETHING_WENT_WRONG,
    statusCode = statusCodes.BAD_REQUEST,
  ) => {
    const tId = setTimeout(() => {
      via.status(statusCode).send({ success: false, message, ...data});
      clearTimeout(tId);
    }, responseDelay);
  },
};

export const $callToAction = (controller: any) => {
  return (req: Request, res: Response, next: NextFunction | never) => {
    const { actions } = new controller(req, res);
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