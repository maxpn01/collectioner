import { Ok, Option, Result } from "ts-results";
import { CollectionRepository } from ".";
import { ItemRepository } from "./item";
import { Failure } from "../utils/failure";

type ViewCollectionResponse = {
	id: string;
	name: string;
	imageOption: Option<string>;
	owner: {
		id: string;
		fullname: string;
		blocked: boolean;
	};
	topic: {
		id: string;
		name: string;
	};
	items: {
		id: string;
		name: string;
		tags: string[];
		createdAt: Date;
	}[];
};

export class ViewCollectionUseCase {
	collectionRepository: CollectionRepository;
	itemRepository: ItemRepository;

	constructor(
		collectionRepository: CollectionRepository,
		itemRepository: ItemRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.itemRepository = itemRepository;
	}

	async execute(id: string): Promise<Result<ViewCollectionResponse, Failure>> {
		const collectionResult = await this.collectionRepository.get(id);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		const itemsResult = await this.itemRepository.getByCollection(id);
		if (itemsResult.err) return itemsResult;
		const items = itemsResult.val;

		const itemsResponse = items.map((item) => ({
			id: item.id,
			name: item.name,
			tags: item.tags,
			createdAt: item.createdAt,
		}));

		return Ok({
			items: itemsResponse,
			id: collection.id,
			owner: collection.owner,
			name: collection.name,
			topic: collection.topic,
			imageOption: collection.imageOption,
		});
	}
}
