import { None, Result } from "ts-results";
import { Collection, CollectionField } from "..";
import { User } from "../../user";
import { Failure } from "../../utils/failure";
import {
	RepoGetIncludedProperties,
	RepoGetOptions,
} from "../../utils/repository";
import { Comment } from "./comments";
import { PrismaClient } from "@prisma/client";

export type Item = {
	collection: Collection;
	id: string;
	name: string;
	tags: Set<string>;
	createdAt: Date;
};

export type ItemField<T> = {
	item: Item;
	collectionField: CollectionField;
	value: T;
};

export type ItemFields = {
	numberFields: ItemField<number>[];
	textFields: ItemField<string>[];
	multilineTextFields: ItemField<string>[];
	checkboxFields: ItemField<boolean>[];
	dateFields: ItemField<Date>[];
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
	create(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	update(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

class PrismaItemRepository implements ItemRepository {
	constructor(private prisma: PrismaClient) {}

	get<O extends GetItemOptions>(
		id: string,
		options?: O | undefined,
	): Promise<Result<GetItemResult<O>, Failure>> {
		throw new Error("Method not implemented.");
	}
	getAll<O extends GetItemOptions>(
		options?: O | undefined,
	): Promise<Result<GetItemResult<O>[], Failure>> {
		throw new Error("Method not implemented.");
	}
	getByCollection<O extends GetItemOptions>(
		id: string,
		options?: O | undefined,
	): Promise<Result<GetItemResult<O>[], Failure>> {
		throw new Error("Method not implemented.");
	}
	create(item: Item, fields: ItemFields): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}
	update(item: Item, fields: ItemFields): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}
	delete(id: string): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}
}
