import { PrismaItemRepository } from "../../collection/item";
import { expressApp } from "../http";
import {
	ExpressSearchItems,
	MeiliItemSearchEngine,
	SearchItemsUseCase,
} from "../../collection/item/search-engine";
import { meili } from "../meili";
import {
	CreateItemUseCase,
	ExpressCreateItem,
} from "../../collection/item/create-item";
import { prismaCollectionRepository } from ".";
import { prismaUserRepository } from "../user";

const itemSearchEngine = new MeiliItemSearchEngine(meili);
export const prismaItemRepository = new PrismaItemRepository();
const searchItems = new SearchItemsUseCase(
	itemSearchEngine,
	prismaItemRepository,
);
const expressSearchItems = new ExpressSearchItems(searchItems);
expressApp.get("/api/item/search", expressSearchItems.execute);

const createItem = new CreateItemUseCase(
	prismaCollectionRepository,
	prismaItemRepository,
	itemSearchEngine,
	prismaUserRepository,
);
const expressCreateItem = new ExpressCreateItem(createItem);
expressApp.post("/api/item", expressCreateItem.execute);
