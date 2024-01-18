import env from "./env";
import { MeiliSearch } from "meilisearch";

export const meili = new MeiliSearch({
	host: "http://localhost:7700",
	apiKey: env.meiliMasterKey,
});
