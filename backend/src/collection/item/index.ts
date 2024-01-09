import { Err, None, Ok, Result } from "ts-results";
import { Collection, CollectionRepository } from "..";
import { User } from "../../user";
import { Failure, NotFoundFailure } from "../../utils/failure";
import {
	KeyValueRepository,
	MemoryKeyValueRepository,
} from "../../utils/key-value";
import {
	RepoGetIncludedProperties,
	RepoGetOptions,
} from "../../utils/repository";
import { Comment } from "./comments";

export type Item = {
	collection: Collection;
	id: string;
	name: string;
	tags: Set<string>;
	createdAt: Date;
};

type ItemFields = {
	numberFields: Map<string, number>;
	textFields: Map<string, string>;
	multilineTextFields: Map<string, string>;
	checkboxFields: Map<string, boolean>;
	dateFields: Map<string, Date>;
};

type ItemLike = {
	item: Item;
	author: User;
};

export function generateItemFieldId(itemId: string, collectionFieldId: string) {
	return `${itemId}->${collectionFieldId}`;
}

type GetItemIncludables = {
	fields: ItemFields;
	comments: Comment[];
};
type GetItemOptions = RepoGetOptions<GetItemIncludables>;
type GetItemResult<O extends GetItemOptions> = {
	item: Item;
} & RepoGetIncludedProperties<GetItemIncludables, O>;

export interface ItemRepository {
	get<O extends GetItemOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetItemResult<O>, Failure>>;
	getAll<O extends GetItemOptions>(
		options?: O,
	): Promise<Result<GetItemResult<O>[], Failure>>;
	getByCollection<O extends GetItemOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetItemResult<O>[], Failure>>;
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
	async get<O extends GetItemOptions>(
		id: string,
		options?: O | undefined,
	): Promise<Result<GetItemResult<O>, Failure>> {
		throw new Error("Method not implemented.");
	}
	async getAll<O extends GetItemOptions>(
		options?: O | undefined,
	): Promise<Result<GetItemResult<O>[], Failure>> {
		throw new Error("Method not implemented.");
	}
	async getByCollection<O extends GetItemOptions>(
		id: string,
		options?: O | undefined,
	): Promise<Result<GetItemResult<O>[], Failure>> {
		throw new Error("Method not implemented.");
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
		throw new Error("Method not implemented");
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
