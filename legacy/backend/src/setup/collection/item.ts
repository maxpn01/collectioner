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
import { prismaCollectionFieldRepository, prismaCollectionRepository } from ".";
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
import {
	ExpressUpdateItem,
	UpdateItemUseCase,
} from "../../collection/item/update-item";
import {
	AutocompleteTagsUseCase,
	ExpressAutocompleteTags,
	PrismaTagsRepository,
} from "../../collection/item/tags";

const itemSearchEngine = new MeiliItemSearchEngine(meili);
export const prismaItemRepository = new PrismaItemRepository();
export const prismaTagsRepository = new PrismaTagsRepository();
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

const updateItem = new UpdateItemUseCase(
	prismaUserRepository,
	prismaItemRepository,
	itemSearchEngine,
	prismaCollectionRepository,
	prismaCollectionFieldRepository,
);
const expressUpdateItem = new ExpressUpdateItem(updateItem);
expressApp.put("/api/item", expressUpdateItem.execute);

const viewItem = new ViewItemUseCase(prismaItemRepository);
const expressViewItem = new ExpressViewItem(viewItem);
expressApp.get("/api/item", expressViewItem.execute);

const autocompleteTags = new AutocompleteTagsUseCase(prismaTagsRepository);
const expressAutocompleteTags = new ExpressAutocompleteTags(autocompleteTags);
expressApp.get("/api/item/tags", expressAutocompleteTags.execute);
