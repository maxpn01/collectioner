let mode = "production";
let isProduction = true;

const isDevelopment = import.meta.env.MODE === "development";
if (isDevelopment) {
	mode = "development";
	isProduction = false;
}

const backendUrlBase = import.meta.env.VITE_BACKEND_URL_BASE!;

export default {
	mode,
	isProduction,
	isDevelopment,
	backendUrlBase,
	backendApiBase: `${backendUrlBase}/api`,
};
