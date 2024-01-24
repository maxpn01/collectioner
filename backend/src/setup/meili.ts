import env from "./env";
import { MeiliSearch } from "meilisearch";

export const meili = new MeiliSearch({
	host: env.meiliHost,
	apiKey: env.meiliMasterKey,
});
