import { Err, None, Ok, Result } from "ts-results";
import {
	Collection,
	CollectionRepository,
	CollectionField,
	CollectionFieldRepository,
} from "..";
import { User } from "../../user";
import { Failure, NotFoundFailure } from "../../utils/failure";

export type Item = {
	collection: Collection;
	id: string;
	name: string;
	tags: string[];
	createdAt: Date;
};

type ItemLike = {
	item: Item;
	author: User;
};

export type ItemField<T> = {
	item: Item;
	id: string;
	collectionField: CollectionField;
	value: T;
};

export type Comment = {
	item: Item;
	id: string;
	author: User;
	text: string;
	createdAt: Date;
};

export interface ItemRepository {
	get(id: string): Promise<Result<Item, Failure>>;
	getByCollection(collectionId: string): Promise<Result<Item[], Failure>>;
	create(item: Item): Promise<Result<None, Failure>>;
	update(id: string, item: Item): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}
export class MemoryItemRepository implements ItemRepository {
	private items: Item[] = [];
	collectionRepository: CollectionRepository;

	constructor(items: Item[], collectionRepository: CollectionRepository) {
		this.items = items;
		this.collectionRepository = collectionRepository;
	}

	async get(id: string): Promise<Result<Item, Failure>> {
		const item = structuredClone(this.items.find((i) => i.id === id));
		if (!item) return Err(new NotFoundFailure());

		const collectionResult = await this.collectionRepository.get(
			item.collection.id,
		);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		item.collection = collection;

		return Ok(item);
	}

	async getByCollection(
		collectionId: string,
	): Promise<Result<Item[], Failure>> {
		const items = structuredClone(
			this.items.filter((i) => i.collection.id === collectionId),
		);

		const collectionResult = await this.collectionRepository.get(collectionId);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		for (const item of items) {
			item.collection = collection;
		}

		return Ok(items);
	}

	async create(item: Item): Promise<Result<None, Failure>> {
		this.items.push(item);
		return Ok(None);
	}

	async update(id: string, item: Item): Promise<Result<None, Failure>> {
		const index = this.items.findIndex((i) => i.id === id);
		if (index === -1) return Err(new NotFoundFailure());

		this.items[index] = item;
		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const index = this.items.findIndex((i) => i.id === id);
		if (index === -1) return Err(new NotFoundFailure());

		this.items.splice(index, 1);
		return Ok(None);
	}
}

export interface ItemFieldRepository<T> {
	get(id: string): Promise<Result<ItemField<T>, Failure>>;
	create(itemField: ItemField<T>): Promise<Result<None, Failure>>;
	update(id: string, itemField: ItemField<T>): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}
export class MemoryItemFieldRepository<T> implements ItemFieldRepository<T> {
	private itemFields: ItemField<T>[] = [];
	itemRepostitory: ItemRepository;
	collectionFieldRepository: CollectionFieldRepository;

	constructor(
		itemFields: ItemField<T>[],
		itemRepository: ItemRepository,
		collectionFieldRepository: CollectionFieldRepository,
	) {
		this.itemFields = itemFields;
		this.itemRepostitory = itemRepository;
		this.collectionFieldRepository = collectionFieldRepository;
	}

	async get(id: string): Promise<Result<ItemField<T>, Failure>> {
		const itemField = structuredClone(this.itemFields.find((f) => f.id === id));
		if (!itemField) return Err(new NotFoundFailure());

		const itemResult = await this.itemRepostitory.get(itemField.item.id);
		if (itemResult.err) return itemResult;
		itemField.item = itemResult.val;

		const cfResult = await this.collectionFieldRepository.get(
			itemField.collectionField.id,
		);
		if (cfResult.err) return cfResult;
		itemField.collectionField = cfResult.val;

		return Ok(itemField);
	}

	async create(itemField: ItemField<T>): Promise<Result<None, Failure>> {
		this.itemFields.push(itemField);
		return Ok(None);
	}

	async update(
		id: string,
		itemField: ItemField<T>,
	): Promise<Result<None, Failure>> {
		const index = this.itemFields.findIndex((f) => f.id === id);
		if (index === -1) return Err(new NotFoundFailure());

		this.itemFields[index] = itemField;
		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const index = this.itemFields.findIndex((f) => f.id === id);
		if (index === -1) return Err(new NotFoundFailure());

		this.itemFields.splice(index, 1);
		return Ok(None);
	}
}
