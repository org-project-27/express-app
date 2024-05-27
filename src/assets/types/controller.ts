import {Request, Response} from "express";
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