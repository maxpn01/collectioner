import { Err, None, Ok, Result } from "ts-results";
import { Collection, CollectionField, CollectionRepository } from "..";
import { User } from "../../user";
import {
	BadRequestFailure,
	Failure,
	NotFoundFailure,
} from "../../utils/failure";
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
	update(id: string, item: Item): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

// class PrismaItemRepository implements ItemRepository {
// 	constructor(private prisma: PrismaClient) {}

// 	async get<O extends GetItemOptions>(
// 		id: string,
// 		options?: O,
// 	): Promise<Result<GetItemResult<O>, Failure>> {
// 		const item = await this.prisma.item.findUnique({
// 			where: { id },
// 			include: options?.include,
// 		});
// 		if (!item) return Err(new NotFoundFailure());
// 		return Ok({ item });
// 	}

// 	async getAll<O extends GetItemOptions>(
// 		options?: O,
// 	): Promise<Result<GetItemResult<O>[], Failure>> {
// 		const items = await this.prisma.item.findMany({
// 			include: options?.include,
// 		});
// 		if (!items) return Err(new NotFoundFailure());
// 		return Ok({ items });
// 	}

// 	async getByCollection<O extends GetItemOptions>(
// 		id: string,
// 		options?: O,
// 	): Promise<Result<GetItemResult<O>[], Failure>> {
// 		const items = await this.prisma.item.findMany({
// 			where: { collectionId: id },
// 			include: options?.include,
// 		});
// 		if (!items) return Err(new NotFoundFailure());
// 		return Ok({ items });
// 	}

// 	async create(item: Item): Promise<Result<None, Failure>> {
// 		const created = await this.prisma.item.create({ data: item });
// 		if (!created) return Err(new BadRequestFailure());
// 		return Ok(None);
// 	}

// 	async update(id: string, item: Item): Promise<Result<None, Failure>> {
// 		const updated = await this.prisma.item.update({
// 			where: { id },
// 			data: item,
// 		});
// 		if (!updated) return Err(new BadRequestFailure());
// 		return Ok(None);
// 	}

// 	async delete(id: string): Promise<Result<None, Failure>> {
// 		const deleted = await this.prisma.item.delete({ where: { id } });
// 		if (!deleted) return Err(new BadRequestFailure());
// 		return Ok(None);
// 	}
// }
