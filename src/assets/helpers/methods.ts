import statusCodes from '../constants/statusCodes';
import createError from 'http-errors';
import dotenv from 'dotenv';
import apiMessageKeys from '../constants/apiMessageKeys';
import { Request, Response, NextFunction } from 'express';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

dotenv.config();
let responseDelay: number = Number(process.env.RESPONSE_DELAY || 0);

export const $sendResponse = {
    success: (data = {}, via: Response, message = apiMessageKeys.DONE, statusCode = statusCodes.OK, other = {}) => {
        const tId = setTimeout(() => {
            via.status(statusCode).send({ success: true, status: statusCode, message, data, ...other });
            clearTimeout(tId);
        }, responseDelay);
    },
    failed: (
        data = {},
        via: Response,
        message = apiMessageKeys.SOMETHING_WENT_WRONG,
        statusCode = statusCodes.BAD_REQUEST
    ) => {
        const tId = setTimeout(() => {
            via.status(statusCode).send({ success: false, status: statusCode, message, ...data });
            clearTimeout(tId);
        }, responseDelay);
    }
};

export const $callToAction = (controller: any) => {
    return (req: Request, res: Response, next: NextFunction | never) => {
        const { actions } = new controller(req, res);
        if (!!actions && !!req && !!res) {
            const { method, path } = req;
            if (actions[method] && actions[method][path]) {
                actions[method][path]({ req, res, next });
            } else {
                let originPath = '';
                let reqParams: Record<string, any> = {};

                for (let p in actions[method]) {
                    if (p.includes('/:')) {
                        let pathParts = p.split('/');
                        let reqParts = path.split('/');

                        if (pathParts.length === reqParts.length) {
                            let isMatched = true;
                            let params: Record<string, any> = {};

                            pathParts.forEach((part, i) => {
                                if (part.startsWith(':')) {
                                    params[part.replace(':', '')] = reqParts[i];
                                } else if (part !== reqParts[i]) {
                                    isMatched = false;
                                }
                            });

                            if (isMatched) {
                                originPath = p;
                                reqParams = params;
                                break;
                            }
                        }
                    }
                }

                if (originPath) {
                    actions[method][originPath]({ req, res, next, params: reqParams });
                } else next(createError(statusCodes.NOT_FOUND));
            }
        } else {
            next(createError(statusCodes.INTERNAL_SERVER_ERROR));
        }
    };
};

export const $writeToFileSafe = (data: string, filePath: string) => {
    const dir = path.dirname(filePath);

    if(existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, data, 'utf8');
}
