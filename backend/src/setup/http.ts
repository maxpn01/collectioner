import { HttpFailurePresenter } from "../http";

export const httpFailurePresenter = new HttpFailurePresenter();

import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectPgSimple from "connect-pg-simple";
import env from "./env";

export const expressApp = express();
expressApp.use(cookieParser());

expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: false }));

const postgressSessionSrore = new (connectPgSimple(session))({
	tableName: "user_session",
	createTableIfMissing: true,
	conObject: {
		connectionString: env.databaseUrl,
		ssl: env.isProduction ? { rejectUnauthorized: false } : false,
	},
});

expressApp.use(
	session({
		name: "c_id",
		store: postgressSessionSrore,
		secret: env.cookieSecret,
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: env.isProduction,
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 30,
		},
	}),
);
