import env from "./setup/env";
import { expressApp } from "./setup/http";

import "./setup/user";
import "./setup/collection";
import "./setup/collection/item";
import "./setup/collection/comment";

expressApp.listen(env.port, () => console.log(`Server started on ${env.port}`));
