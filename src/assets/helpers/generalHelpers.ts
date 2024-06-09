import * as fs from "node:fs";
import moment from "moment";
import path from "path";
import {PathLike} from "node:fs";
import {ASCII_logo, currentLogFilePath, logsBasePath} from "#assets/constants/general";
import {sendLogToTelegramBot} from "#helpers/TelegramBot";

export function deepCopy(model: any){
    return JSON.parse(JSON.stringify(model));
}

export function trimObjectValues(object: any = {}){
    Object.keys(object).forEach(key => {
        if(object[key]){
            object[key] = object[key]?.trim();
        } else {
            object[key] = null;
        }
    });
    return object;
}


export function writeToFile(content: string, filePath: string) {
    try {
        fs.writeFileSync(filePath, content);
        // file written successfully
    } catch (err) {
        console.error(err);
    }
}

export function readFromFile(filePath: string) {
    try {
        return fs.readFileSync(filePath).toString();
        // file written successfully
    } catch (err) {
        console.error(err);
    }
}

export function isResponseSuccessful(statusCode: number) {
    // Check if the status code is in the range of 200 to 299, which typically indicates success
    return statusCode ===304 || statusCode >= 200 && statusCode < 300;
}

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