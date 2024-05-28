import {Request, Response} from "express";
import { PrismaClient } from '@prisma/client'

type MethodType = any;

export type Methods = {
    GET: MethodType,
    POST: MethodType,
    PUT: MethodType,
    PATCH: MethodType,
    DELETE: MethodType
}

export class Controller {
    public request: Request;
    public response: Response;
    public actions: Methods;
    public database = new PrismaClient();
    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
        this.actions = {
            GET: {},
            POST: {},
            PUT: {},
            PATCH: {},
            DELETE: {}
        }
    }
}