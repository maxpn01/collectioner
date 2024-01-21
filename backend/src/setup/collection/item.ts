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
import {
	DeleteItemUseCase,
	ExpressDeleteItem,
} from "../../collection/item/delete-item";
import {
	ExpressViewItem,
	ViewItemUseCase,
} from "../../collection/item/view-item";
import { requireAuth } from "../middleware/auth";

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
expressApp.post("/api/item", requireAuth, expressCreateItem.execute);

const deleteItem = new DeleteItemUseCase(
	prismaUserRepository,
	prismaItemRepository,
	itemSearchEngine,
	prismaCollectionRepository,
);
const expressDeleteItem = new ExpressDeleteItem(deleteItem);
expressApp.delete("/api/item", expressDeleteItem.execute);

const viewItem = new ViewItemUseCase(prismaItemRepository);
const expressViewItem = new ExpressViewItem(viewItem);
expressApp.get("/api/item", expressViewItem.execute);
