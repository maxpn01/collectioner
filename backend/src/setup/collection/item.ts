import { PrismaItemRepository } from "../../collection/item";
import { expressApp } from "../http";
import {
	ExpressSearchItems,
	MeiliItemSearchEngine,
	SearchItemsUseCase,
} from "../../collection/item/search-engine";
import { meili } from "../meili";

const itemSearchEngine = new MeiliItemSearchEngine(meili);
export const prismaItemRepository = new PrismaItemRepository();
const searchItems = new SearchItemsUseCase(
	itemSearchEngine,
	prismaItemRepository,
);
const expressSearchItems = new ExpressSearchItems(searchItems);

expressApp.get("/item/search", expressSearchItems.execute);
