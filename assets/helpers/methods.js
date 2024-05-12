import statusCodes from "./statusCodes.js";
import createError from "http-errors";
import dotenv from "dotenv";
import apiMessageKeys from "../constants/apiMessageKeys.js";
import jwt from "jsonwebtoken";
import {$verifyTokenSession} from "./jwt.js";

dotenv.config();
const responseDelay = process.env.RESPONSE_DELAY || 0;

export const $sendResponse = {
  success: (
    via,
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
    via,
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

export const $callToAction = (actions) => {
  return (req, res, next) => {
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

export const $authenticateToken = async (req, res, next) => {
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
  req["user_auth_id"] = payload.user_id;
  req["token_session"] = session;
  next();
};

export const $filterObject = (target= {}, filters = [], options = { reverse: false }) => {
  const filteredObject = {};
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