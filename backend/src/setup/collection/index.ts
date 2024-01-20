import {
	CreateCollectionUseCase,
	ExpressCreateCollection,
} from "../../collection/create-collection";
import {
	DeleteCollectionUseCase,
	ExpressDeleteCollection,
} from "../../collection/delete-collection";
import { PrismaCollectionRepository } from "../../collection/repositories/collection";
import { PrismaTopicRepository } from "../../collection/repositories/topic";
import { MeiliCollectionSearchEngine } from "../../collection/search-engine";
import { expressApp } from "../http";
import { meili } from "../meili";
import { requireAuth } from "../middleware/auth";
import { prismaUserRepository } from "../user";

export const prismaCollectionRepository = new PrismaCollectionRepository();
export const prismaTopicRepository = new PrismaTopicRepository();
export const meiliCollectionSearchEngine = new MeiliCollectionSearchEngine(
	meili,
);

const createCollection = new CreateCollectionUseCase(
	prismaCollectionRepository,
	meiliCollectionSearchEngine,
	prismaTopicRepository,
	prismaUserRepository,
);
const expressCreateCollection = new ExpressCreateCollection(createCollection);
expressApp.post(
	"/api/collection",
	requireAuth,
	expressCreateCollection.execute,
);

const deleteCollection = new DeleteCollectionUseCase(
	prismaCollectionRepository,
	meiliCollectionSearchEngine,
	prismaUserRepository,
);
const expressDeleteCollection = new ExpressDeleteCollection(deleteCollection);
expressApp.delete(
	"/api/collection",
	requireAuth,
	expressDeleteCollection.execute,
);
