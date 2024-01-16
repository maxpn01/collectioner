import dotenv from "dotenv";
dotenv.config(); // Must be before .env and other files that use process.env
import env from "./setup/env";
import { app } from "./setup/express";

import "./setup/search";

app.listen(env.port, () => console.log(`Server started on ${env.port}`));
