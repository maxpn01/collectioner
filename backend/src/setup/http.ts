import { HttpFailurePresenter } from "../http";

export const httpFailurePresenter = new HttpFailurePresenter();

import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import env from "./env";

export const expressApp = express();

expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: false }));

const postgressSessionStore = new (connectPgSimple(session))({
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
		store: postgressSessionStore,
		secret: env.cookieSecret,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: env.isProduction,
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 30,
		},
	}),
);
