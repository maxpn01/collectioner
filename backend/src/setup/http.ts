import express from "express";
const cors = require("cors");
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import env from "./env";
import path from "path";

export const expressApp = express();

expressApp.use(
	cors({
		origin: "http://localhost:5173",
		optionsSuccessStatus: 200,
		credentials: true,
	}),
);
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
			sameSite: env.isProduction ? "strict" : undefined,
			maxAge: 1000 * 60 * 60 * 24 * 30,
		},
	}),
);

expressApp.set("trust proxy", 1);

if (env.isProduction) {
	const __dirname = path.resolve();
	expressApp.use(express.static(path.join(__dirname, "/frontend/dist")));

	expressApp.get("*", (req, res) =>
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html")),
	);
} else {
	expressApp.get("/", (req, res) => {
		res.send("Server is running....");
	});
}
