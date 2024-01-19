import { PrismaCollectionRepository } from "../../collection/repositories/collection";
import { PrismaTopicRepository } from "../../collection/repositories/topic";
import { MeiliCollectionSearchEngine } from "../../collection/search-engine";
import { meili } from "../search";

export const prismaCollectionRepository = new PrismaCollectionRepository();
export const prismaTopicRepository = new PrismaTopicRepository();
export const meiliCollectionSearchEngine = new MeiliCollectionSearchEngine(
	meili,
);
