import { Err, None, Ok, Result } from "ts-results";
import { Collection, CollectionRepository, ItemField } from "..";
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

type NumberField = {
	item: Item;
	id: string;
	field: ItemField;
	value: number;
};
type TextField = {
	item: Item;
	id: string;
	field: ItemField;
	value: string;
};
type MultilineTextField = {
	item: Item;
	id: string;
	field: ItemField;
	value: string;
};
type CheckboxField = {
	item: Item;
	id: string;
	field: ItemField;
	value: boolean;
};
type DateField = {
	item: Item;
	id: string;
	field: ItemField;
	value: Date;
};

type Comment = {
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
		const item = this.items.find((i) => i.id === id);
		if (!item) return Err(new NotFoundFailure());

		return Ok(item);
	}

	async getByCollection(
		collectionId: string,
	): Promise<Result<Item[], Failure>> {
		const items = this.items.filter((i) => i.collection.id === collectionId);
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
