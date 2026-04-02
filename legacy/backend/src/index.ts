import env from "./setup/env";
import { expressApp, setupStatic } from "./setup/http";

import "./setup/user";
import "./setup/collection";
import "./setup/collection/item";
import "./setup/collection/comment";

setupStatic();

expressApp.listen(env.port, () => console.log(`Server started on ${env.port}`));
