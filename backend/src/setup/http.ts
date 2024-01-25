import express from "express";
const cors = require("cors");
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import env from "./env";

export const expressApp = express();

const corsOptions = {
	origin: "http://localhost:5173",
	optionsSuccessStatus: 200,
};

expressApp.use(cors(corsOptions));
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
			sameSite: "strict",
			maxAge: 1000 * 60 * 60 * 24 * 30,
		},
	}),
);

if (env.isProduction) {
	expressApp.set("trust proxy", 1);
}

expressApp.get("/", (req, res) => res.send("Server is running ..."));
