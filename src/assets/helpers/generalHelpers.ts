import * as fs from "node:fs";
import moment from "moment";

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
    return statusCode >= 200 && statusCode < 300;
}

type  loggedTrigger = 'node' | 'prisma' | 'token_controller' | 'user_controller' | string

export function $logged(action: string | undefined = undefined, success: boolean, trigger: loggedTrigger = 'node', ip: string | null = null){
    const type = success ? 'DONE' : 'FAIL';
    const logFilePath = 'src/bin/logs.txt';

    const date = {
        clock: moment().format('HH:mm:ss'),
        calendar: moment().format('DD/MM/YYYY')
    }
    if(ip && ip.includes('::ffff:')){
        ip = ip.replace('::ffff:', '')
    }
    const logDate = `${date.calendar}:${date.clock}`;

    const log = `# ${success ? '[🟢]' : '[🔴]'}[${type}][${logDate}] -> [from:"${trigger}"${ip ? '(🏷️IP:'+ ip + ')' : ''}] => [${action}]`;
    console.log(log);
    let beforeLogs = readFromFile(logFilePath);
    const logs = beforeLogs + "\n" + log;
    writeToFile(logs, logFilePath)
}

export function $loggedForMorgan(message: string){
    const morganData = message.split('"');
    const IP = morganData[0] || '--';
    const reqHeader = morganData[1] || '--';
    const reqStatus = morganData[2] || '--';
    const reqFromURL = morganData[3] || '--';
    const reqBrowserInfo = morganData[5] || '--';

    const reqMethod = reqHeader.split(" ")[0] || '--';
    const reqToURL = reqHeader.split(" ")[1] || '--';
    const reqHTTPType =  reqHeader.split(" ")[2] || '--';
    const reqStatusCode = reqStatus.trim().split(' ')[0];
    const resTime = reqStatus.trim().split(' ')[1] + 'ms';
    const resSuccess = isResponseSuccessful(Number(reqStatusCode))
    let reqFromIp = IP.split(" ")[0];
    const action = `🔘<${reqHeader})>(status: ${reqStatusCode}) -- ${resTime}`

    $logged(action, resSuccess, `${reqFromURL}`, reqFromIp);
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