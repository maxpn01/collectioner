import { Err, None, Ok, Result } from "ts-results";
import { Collection, CollectionRepository } from "..";
import { User } from "../../user";
import { Failure, NotFoundFailure } from "../../utils/failure";
import {
	KeyValueRepository,
	MemoryKeyValueRepository,
} from "../../utils/key-value";

export type Item = {
	collection: Collection;
	id: string;
	name: string;
	tags: Set<string>;
	createdAt: Date;
};

type ItemLike = {
	item: Item;
	author: User;
};

export function generateItemFieldId(itemId: string, collectionFieldId: string) {
	return `${itemId}->${collectionFieldId}`;
}

export interface ItemRepository {
	get(id: string): Promise<Result<Item, Failure>>;
	getAll(): Promise<Result<Item[], Failure>>;
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
		throw new Error("Not implemented");
	}

	async getAll(): Promise<Result<Item[], Failure>> {
		throw new Error("Not implemented");
	}

	async getByCollection(
		collectionId: string,
	): Promise<Result<Item[], Failure>> {
		throw new Error("Not implemented");
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

export type ItemFieldRepositories = {
	number: ItemFieldRepository<number>;
	text: ItemFieldRepository<string>;
	multilineText: ItemFieldRepository<string>;
	checkbox: ItemFieldRepository<boolean>;
	date: ItemFieldRepository<Date>;
};

export interface ItemFieldRepository<T> extends KeyValueRepository<T> {
	deleteByItem(
		itemId: string,
		collectionFieldIds: string[],
	): Promise<Result<None, Failure>>;
}

export class MemoryItemFieldRepository<T>
	extends MemoryKeyValueRepository<T>
	implements ItemFieldRepository<T>
{
	constructor(map: Map<string, T>) {
		super(map);
	}

	async deleteByItem(
		itemId: string,
		collectionFieldIds: string[],
	): Promise<Result<None, Failure>> {
		for (const collectionFieldId of collectionFieldIds) {
			const itemFieldId = generateItemFieldId(itemId, collectionFieldId);

			this.map.delete(itemFieldId);
		}
		return Ok(None);
	}
}
