import dotenv from "dotenv";
dotenv.config();

const mode = process.env.NODE_ENV ?? "production";

const env = {
	mode,
	isProduction: mode === "production",
	isDevelopment: mode === "development",
	port: process.env.PORT ?? 5000,
	meiliMasterKey: process.env.MEILI_MASTER_KEY!,
	cookieSecret: process.env.COOKIE_SECRET!,
	databaseUrl: process.env.DATABASE_URL!,
};

export default env;
