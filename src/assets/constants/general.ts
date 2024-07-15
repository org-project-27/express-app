import { config } from "dotenv";
import { existsSync, mkdir, writeFile } from "fs";
config();

export const ASCII_logo = `
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||                                                          ||
||   //////  //   //  /////   /////   /////  /////  /////   ||
||   //       // //   //  //  //  //  //     //     //      ||
||   //////    ///    /////   ////    /////  /////  /////   ||
||   //       // //   //      // //   //        //     //   ||
||   //////  //   //  //      //  //  /////  /////  /////   ||
||                                                          ||
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
`;

const isDev = process.env.NODE_ENV === 'development';

export const currentLogFilePath = isDev ? 'src/bin/logs/logs.txt' : 'dist/bin/logs/logs.txt';
export const logsBasePath = isDev ? 'src/bin/logs': 'dist/bin/logs';

if (!existsSync(logsBasePath)) {
    mkdir(logsBasePath, { recursive: true }, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

if (!existsSync(currentLogFilePath)) {
    writeFile(currentLogFilePath, '', (err) => {
        if (err) {
            console.error(err);
        }
    });
}
