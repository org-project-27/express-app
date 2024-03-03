import statusCodes from "./statusCodes.js";
import createError from "http-errors";
import dotenv from "dotenv";
import apiMessageKeys from "../constants/apiMessageKeys.js";
import jwt from "jsonwebtoken";

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

export const $authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) {
    return $sendResponse.failed(
      res,
      statusCodes.UNAUTHORIZED,
      apiMessageKeys.SOMETHING_WENT_WRONG
    );
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
    if (err) {
      return $sendResponse.failed(
        res,
        statusCodes.FORBIDDEN,
        apiMessageKeys.INVALID_TOKEN
      );
    }

    req["user_auth_id"] = data.user_id;
    next();
  });
};
