import env from "./setup/env";
import { expressApp } from "./setup/http";

import "./setup/search";
import "./setup/user";

expressApp.listen(env.port, () => console.log(`Server started on ${env.port}`));
