import 'module-alias/register';
import database from "#assets/configurations/sequelizeConfig";
import createHttpError from "http-errors";
import useragent from "express-useragent";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from 'dotenv';

import HttpCodes from "#assets/constants/statusCodes";
import indexRouter from "#routes/index";
import apiRouter from "#routes/api";
import checkServiceSecretKey from "~/middlewares/checkServiceSecretKey";
import sync from "~/db/sync";

dotenv.config();
const app = express();
// #AREA - view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(useragent.express());

// #AREA - for accept post request data within the request body
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// #AREA - access static files
app.use(express.static("public"));

// #AREA - cors settings
app.use(
    cors({
        origin: process.env.ACCEPTABLE_CORS_ORIGIN,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: HttpCodes.NO_CONTENT,
    })
);

// #AREA - routes
app.use("/", checkServiceSecretKey, indexRouter);

// #AREA - init
database.authenticate()
    .then(async () => {
        console.warn("Database started at:", new Date())
        await sync();
        app.use("/api", apiRouter);
    })
    .catch(async (err: any) => {
        console.warn("Database crashed at:", new Date())
        app.use("/api", function (req, res, next) {
            next(createHttpError(HttpCodes.SERVICE_UNAVAILABLE));
        });
        await database.close();
        throw err;
    })
    .finally(() => {
        // #AREA - catch 404 and forward to error handler
        app.use(function (req, res, next) {
            next(createHttpError(HttpCodes.NOT_FOUND));
        });

        // #AREA - error handler
        app.use(function (err: any, req, res: any) {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get("env") === "development" ? err : {};

            // render the error page
            res.status(err.status || HttpCodes.INTERNAL_SERVER_ERROR);
            res.render("error");
        });
    });
export default app;