import { Err, None, Ok, Result } from "ts-results";
import {
	Collection,
	CollectionField,
	PrismaCollection,
	prismaCollectionToEntity,
} from "..";
import { PrismaUser, User, prismaUserToEntity } from "../../user";
import {
	Failure,
	NotFoundFailure,
	ValidateLengthFailure,
} from "../../utils/failure";
import {
	RepoGetIncludedProperties,
	RepoGetOptions,
} from "../../utils/repository";
import { Comment, prismaCommentToEntity } from "./comment";
import { Prisma, PrismaClient } from "@prisma/client";

import {
	Item as PrismaItem,
	ItemTag as PrismaItemTag,
	NumberField as PrismaNumberField,
	TextField as PrismaTextField,
	MultilineTextField as PrismaMultilineTextField,
	CheckboxField as PrismaCheckboxField,
	DateField as PrismaDateField,
	CollectionField as PrismaCollectionField,
	Comment as PrismaComment,
} from "@prisma/client";
import { PrismaTopic } from "../repositories/topic";
import { safeDateConversion } from "../../utils/date";
import { PrismaErrors } from "../../utils/prisma";
import { HttpFailure, JsonHttpFailure, httpFailurePresenter } from "../../http";

export { Item as PrismaItem, ItemTag as PrismaItemTag } from "@prisma/client";

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

export class ValidateItemNameFailure extends ValidateLengthFailure {}
export class ValidateItemTagsLengthFailure extends ValidateLengthFailure {}
export class ValidateItemTagFailure extends ValidateLengthFailure {}

export function validateItemName(
	itemName: string,
): Result<None, ValidateItemNameFailure> {
	const satisfiesMinLength = itemName.length >= 5;
	const satisfiesMaxLength = itemName.length <= 100;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid) {
		return Err(
			new ValidateItemNameFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
			}),
		);
	}

	return Ok(None);
}

export function validateItemTagsLength(
	itemTags: Set<string>,
): Result<None, ValidateItemTagsLengthFailure> {
	const satisfiesMinLength = itemTags.size >= 0;
	const satisfiesMaxLength = itemTags.size <= 100;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid)
		return Err(
			new ValidateItemTagsLengthFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
			}),
		);

	return Ok(None);
}

export function validateItemTag(
	itemTag: string,
): Result<None, ValidateItemTagFailure> {
	const satisfiesMinLength = itemTag.length >= 1;
	const satisfiesMaxLength = itemTag.length <= 30;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid) {
		return Err(
			new ValidateItemTagFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
			}),
		);
	}

	return Ok(None);
}

export function validateItem(
	name: string,
	tags: Set<string>,
): Result<None, Failure> {
	const validateItemNameResult = validateItemName(name);
	if (validateItemNameResult.err) return validateItemNameResult;

	const validateItemTagsLengthResult = validateItemTagsLength(tags);
	if (validateItemTagsLengthResult.err) return validateItemTagsLengthResult;

	for (const tag in tags) {
		const validateItemTagResult = validateItemTag(tag);
		if (validateItemTagResult.err) return validateItemTagResult;
	}

	return Ok(None);
}

export function itemHttpFailurePresenter(failure: Failure): HttpFailure {
	if (failure instanceof ValidateItemNameFailure) {
		return new JsonHttpFailure(422, {
			satisfiesMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
		});
	}

	if (failure instanceof ValidateItemTagFailure) {
		return new JsonHttpFailure(422, {
			satisfiesMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
		});
	}

	if (failure instanceof ValidateItemTagsLengthFailure) {
		return new JsonHttpFailure(422, {
			satisfiesMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
		});
	}

	if (failure instanceof ItemNameIsTakenFailure) {
		return new JsonHttpFailure(409, {
			itemNameIsTaken: true,
		});
	}

	return httpFailurePresenter(failure);
}

export class ItemNameIsTakenFailure extends Failure {}

export function generateItemFieldId(itemId: string, collectionFieldId: string) {
	return `${itemId}->${collectionFieldId}`;
}

export type GetItemIncludables = {
	fields: ItemFields;
	comments: Comment[];
};
export type GetItemIncludedProperties<O extends GetItemOptions> =
	RepoGetIncludedProperties<GetItemIncludables, O>;
export type GetItemOptions = RepoGetOptions<GetItemIncludables>;
export type GetItemResult<O extends GetItemOptions> = {
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
	getMany(ids: Set<string>): Promise<Result<Item[], Failure>>;
	getOneFromEachCollection(
		collectionIds: Set<string>,
	): Promise<Result<Item[], Failure>>;
	create(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	update(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export class PrismaItemRepository implements ItemRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async get<O extends GetItemOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetItemResult<O>, Failure>> {
		const prismaFieldsInclude = (options?.include?.fields && {
			include: {
				collectionField: {
					include: {
						collection: options?.include?.fields,
					},
				},
			},
		})!;
		const prismaCommentsInclude = (options?.include?.comments && {
			include: {
				author: options?.include?.comments,
			},
		})!;

		const prismaItem = await this.prisma.item.findUnique({
			where: { id },
			include: {
				numberFields: prismaFieldsInclude,
				textFields: prismaFieldsInclude,
				multilineTextFields: prismaFieldsInclude,
				checkboxFields: prismaFieldsInclude,
				dateFields: prismaFieldsInclude,
				comments: prismaCommentsInclude,
				collection: {
					include: {
						owner: true,
						topic: true,
					},
				},
				tags: true,
			},
		});
		if (!prismaItem) return Err(new NotFoundFailure());

		const results = prismaItemToGetItemResult(prismaItem, options);

		return Ok(results);
	}

	async getAll<O extends GetItemOptions>(
		options?: O,
	): Promise<Result<GetItemResult<O>[], Failure>> {
		const prismaFieldsInclude = (options?.include?.fields && {
			include: {
				collectionField: {
					include: {
						collection: options?.include?.fields,
					},
				},
			},
		})!;
		const prismaCommentsInclude = (options?.include?.comments && {
			include: {
				author: options?.include?.comments,
			},
		})!;

		const prismaItems = await this.prisma.item.findMany({
			include: {
				numberFields: prismaFieldsInclude,
				textFields: prismaFieldsInclude,
				multilineTextFields: prismaFieldsInclude,
				checkboxFields: prismaFieldsInclude,
				dateFields: prismaFieldsInclude,
				comments: prismaCommentsInclude,
				collection: {
					include: {
						owner: true,
						topic: true,
					},
				},
				tags: true,
			},
		});

		const results = prismaItems.map((pi) =>
			prismaItemToGetItemResult(pi, options),
		);

		return Ok(results);
	}

	async getByCollection<O extends GetItemOptions>(
		id: string,
		options?: O | undefined,
	): Promise<Result<GetItemResult<O>[], Failure>> {
		const prismaFieldsInclude = (options?.include?.fields && {
			include: {
				collectionField: {
					include: {
						collection: options?.include?.fields,
					},
				},
			},
		})!;
		const prismaCommentsInclude = (options?.include?.comments && {
			include: {
				author: options?.include?.comments,
			},
		})!;

		const prismaItems = await this.prisma.item.findMany({
			where: {
				collectionId: id,
			},
			include: {
				numberFields: prismaFieldsInclude,
				textFields: prismaFieldsInclude,
				multilineTextFields: prismaFieldsInclude,
				checkboxFields: prismaFieldsInclude,
				dateFields: prismaFieldsInclude,
				comments: prismaCommentsInclude,
				collection: {
					include: {
						owner: true,
						topic: true,
					},
				},
				tags: true,
			},
		});

		const results = prismaItems.map((pi) =>
			prismaItemToGetItemResult(pi, options),
		);

		return Ok(results);
	}

	async getMany(ids: Set<string>): Promise<Result<Item[], Failure>> {
		const prismaItems = await this.prisma.item.findMany({
			where: { id: { in: [...ids] } },
			include: {
				collection: {
					include: {
						owner: true,
						topic: true,
					},
				},
				tags: true,
			},
		});

		const items: Item[] = prismaItems.map((pi) => {
			const collection = prismaCollectionToEntity(
				pi.collection,
				pi.collection.topic,
				prismaUserToEntity(pi.collection.owner),
			);
			return prismaItemToEntity(pi, collection);
		});

		return Ok(items);
	}

	async getOneFromEachCollection(
		collectionIds: Set<string>,
	): Promise<Result<Item[], Failure>> {
		const prismaItems = await this.prisma.item.findMany({
			where: { collectionId: { in: [...collectionIds] } },
			include: {
				collection: {
					include: {
						owner: true,
						topic: true,
					},
				},
				tags: true,
			},
		});

		const items: Item[] = prismaItems.map((pi) => {
			const collection = prismaCollectionToEntity(
				pi.collection,
				pi.collection.topic,
				prismaUserToEntity(pi.collection.owner),
			);
			return prismaItemToEntity(pi, collection);
		});

		return Ok(items);
	}

	async create(item: Item, fields: ItemFields): Promise<Result<None, Failure>> {
		try {
			await this.prisma.item.create({
				data: {
					id: item.id,
					name: item.name,
					collectionId: item.collection.id,
					tags: {
						create: Array.from(item.tags).map((tag) => ({ tag })),
					},
					numberFields: {
						create: fields.numberFields.map((f) => ({
							collectionFieldId: f.collectionField.id,
							value: f.value,
						})),
					},
					textFields: {
						create: fields.textFields.map((f) => ({
							collectionFieldId: f.collectionField.id,
							value: f.value,
						})),
					},
					multilineTextFields: {
						create: fields.multilineTextFields.map((f) => ({
							collectionFieldId: f.collectionField.id,
							value: f.value,
						})),
					},
					checkboxFields: {
						create: fields.checkboxFields.map((f) => ({
							collectionFieldId: f.collectionField.id,
							value: f.value,
						})),
					},
					dateFields: {
						create: fields.dateFields.map((f) => ({
							collectionFieldId: f.collectionField.id,
							value: safeDateConversion(f.value),
						})),
					},
				},
			});
		} catch (e) {
			const isPrismaError = e instanceof Prisma.PrismaClientKnownRequestError;
			if (!isPrismaError) throw e;

			if (e.code === PrismaErrors.UniqueConstraintFailed) {
				const target = e.meta?.target as string[];

				if (target.includes("name")) return Err(new ItemNameIsTakenFailure());
			} else throw e;
		}

		return Ok(None);
	}

	async update(item: Item, fields: ItemFields): Promise<Result<None, Failure>> {
		await this.prisma.item.update({
			where: { id: item.id },
			data: {
				name: item.name,
				tags: {
					deleteMany: {},
					create: Array.from(item.tags).map((tag) => ({ tag })),
				},
				numberFields: {
					deleteMany: {},
					create: fields.numberFields.map((f) => ({
						collectionFieldId: f.collectionField.id,
						value: f.value,
					})),
				},
				textFields: {
					deleteMany: {},
					create: fields.textFields.map((f) => ({
						collectionFieldId: f.collectionField.id,
						value: f.value,
					})),
				},
				multilineTextFields: {
					deleteMany: {},
					create: fields.multilineTextFields.map((f) => ({
						collectionFieldId: f.collectionField.id,
						value: f.value,
					})),
				},
				checkboxFields: {
					deleteMany: {},
					create: fields.checkboxFields.map((f) => ({
						collectionFieldId: f.collectionField.id,
						value: f.value,
					})),
				},
				dateFields: {
					deleteMany: {},
					create: fields.dateFields.map((f) => ({
						collectionFieldId: f.collectionField.id,
						value: safeDateConversion(f.value),
					})),
				},
			},
		});

		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		await this.prisma.item.delete({ where: { id } });

		return Ok(None);
	}
}

export function prismaItemToEntity(
	model: PrismaItem & { tags: PrismaItemTag[] },
	collection: Collection,
): Item {
	return {
		collection,
		tags: new Set(model.tags.map((t) => t.tag)),
		id: model.id,
		name: model.name,
		createdAt: model.createdAt,
	};
}

export function prismaNumberFieldToEntity(
	model: PrismaNumberField,
	item: Item,
	collectionField: CollectionField,
): ItemField<number> {
	return {
		item,
		collectionField,
		value: model.value,
	};
}

export function prismaTextFieldToEntity(
	model: PrismaTextField,
	item: Item,
	collectionField: CollectionField,
): ItemField<string> {
	return {
		item,
		collectionField,
		value: model.value,
	};
}

export function prismaMultilineTextFieldToEntity(
	model: PrismaMultilineTextField,
	item: Item,
	collectionField: CollectionField,
): ItemField<string> {
	return {
		item,
		collectionField,
		value: model.value,
	};
}

export function prismaCheckboxFieldToEntity(
	model: PrismaCheckboxField,
	item: Item,
	collectionField: CollectionField,
): ItemField<boolean> {
	return {
		item,
		collectionField,
		value: model.value,
	};
}

export function prismaDateFieldToEntity(
	model: PrismaDateField,
	item: Item,
	collectionField: CollectionField,
): ItemField<Date> {
	return {
		item,
		collectionField,
		value: model.value,
	};
}

function prismaItemToGetItemResult<O extends GetItemOptions>(
	pi: PrismaItem & {
		tags: PrismaItemTag[];
		collection: PrismaCollection & { owner: PrismaUser; topic: PrismaTopic };
		numberFields: (PrismaNumberField & {
			collectionField: PrismaCollectionField;
		})[];
		textFields: (PrismaTextField & {
			collectionField: PrismaCollectionField;
		})[];
		multilineTextFields: (PrismaMultilineTextField & {
			collectionField: PrismaCollectionField;
		})[];
		checkboxFields: (PrismaCheckboxField & {
			collectionField: PrismaCollectionField;
		})[];
		dateFields: (PrismaDateField & {
			collectionField: PrismaCollectionField;
		})[];
		comments: (PrismaComment & { author: PrismaUser })[];
	},
	options?: O | undefined,
): GetItemResult<O> {
	const item: Item = prismaItemToEntity(
		pi,
		prismaCollectionToEntity(
			pi.collection,
			pi.collection.topic,
			prismaUserToEntity(pi.collection.owner),
		),
	);

	const includables: Partial<GetItemIncludables> = {};

	if (options?.include?.fields) {
		const numberFields = pi.numberFields.map((nf) =>
			prismaNumberFieldToEntity(nf, item, {
				...nf.collectionField,
				collection: item.collection,
			}),
		);
		const textFields = pi.textFields.map((tf) =>
			prismaTextFieldToEntity(tf, item, {
				...tf.collectionField,
				collection: item.collection,
			}),
		);
		const multilineTextFields = pi.multilineTextFields.map((mtf) =>
			prismaMultilineTextFieldToEntity(mtf, item, {
				...mtf.collectionField,
				collection: item.collection,
			}),
		);
		const checkboxFields = pi.checkboxFields.map((cf) =>
			prismaCheckboxFieldToEntity(cf, item, {
				...cf.collectionField,
				collection: item.collection,
			}),
		);
		const dateFields = pi.dateFields.map((df) =>
			prismaDateFieldToEntity(df, item, {
				...df.collectionField,
				collection: item.collection,
			}),
		);

		includables.fields = {
			numberFields,
			textFields,
			multilineTextFields,
			checkboxFields,
			dateFields,
		};
	}

	if (options?.include?.comments) {
		const comments = pi.comments.map((comment) =>
			prismaCommentToEntity(comment, item),
		);

		includables.comments = comments;
	}

	return {
		item,
		...(includables as GetItemIncludedProperties<O>),
	};
}
