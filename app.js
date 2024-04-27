import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import indexRouter from "./routes/index.js";
import apiRouter from "./routes/api.js";
import dotenv from 'dotenv';
import database from "./configs/sequelizeConfig.js";
import HttpCodes from "./assets/helpers/statusCodes.js";
import sync from "./db/sync.js";
import useragent from "express-useragent";

dotenv.config();
const app = express();
const __dirname = process.cwd();
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
app.use("/", indexRouter);
// This ensures that the /api request is unreachable if the db connection fails.
database.authenticate()
  .then(async () => {
    console.clear();
    await sync();
    app.use("/api", apiRouter);
  })
  .catch((err) => {
    app.use("/api", function (req, res, next) {
      next(createError(HttpCodes.SERVICE_UNAVAILABLE));
    });
    database.close();
    throw err;
  })
  .finally(() => {
    // #AREA - catch 404 and forward to error handler
    app.use(function (req, res, next) {
      next(createError(HttpCodes.NOT_FOUND));
    });

    // #AREA - error handler
    app.use(function (err, req, res) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};

      // render the error page
      res.status(err.status || HttpCodes.INTERNAL_SERVER_ERROR);
      res.render("error");
    });
  });

export default app;