import { Err, None, Ok, Option, Result } from "ts-results";
import { PrismaUser, User, prismaUserToEntity } from "../user";
import { Item } from "./item";
import { RepoGetIncludedProperties, RepoGetOptions } from "../utils/repository";
import {
	Collection as PrismaCollection,
	CollectionField as PrismaCollectionField,
} from "@prisma/client";
import { nullableToOption } from "../utils/ts-results";
import { prismaTopicToEntity, PrismaTopic } from "./repositories/topic";
import { Failure, ValidateLengthFailure } from "../utils/failure";

export { Collection as PrismaCollection } from "@prisma/client";

export type Topic = {
	id: string;
	name: string;
};

export type Collection = {
	owner: User;
	id: string;
	name: string;
	topic: Topic;
	imageOption: Option<string>;
};
export type CollectionField = {
	id: string;
	name: string;
	collection: Collection;
	type: CollectionFieldType;
};

export class ValidateCollectionNameFailure extends ValidateLengthFailure {}

export function validateCollectionName(
	collectionName: string,
): Result<None, ValidateCollectionNameFailure> {
	const satisfiesMinLength = collectionName.length >= 1;
	const satisfiesMaxLength = collectionName.length <= 100;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid) {
		return Err(
			new ValidateCollectionNameFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
			}),
		);
	}

	return Ok(None);
}

export class CollectionNameIsTakenFailure extends Failure {}
export class CollectionFieldNameIsTakenFailure extends Failure {}

export const CollectionFieldType = {
	Number: "Number",
	Text: "Text",
	MultilineText: "MultilineText",
	Checkbox: "Checkbox",
	Date: "Date",
} as const;
export type CollectionFieldType =
	(typeof CollectionFieldType)[keyof typeof CollectionFieldType];
export const collectionFieldTypes: CollectionFieldType[] = [
	"Number",
	"Text",
	"MultilineText",
	"Checkbox",
	"Date",
] as const;

export type GetCollectionIncludables = {
	items: Item[];
	fields: CollectionField[];
};
export type GetCollectionIncludedProperties<O extends GetCollectionOptions> =
	RepoGetIncludedProperties<GetCollectionIncludables, O>;
export type GetCollectionOptions = RepoGetOptions<GetCollectionIncludables>;
export type GetCollectionResult<O extends GetCollectionOptions> = {
	collection: Collection;
} & RepoGetIncludedProperties<GetCollectionIncludables, O>;

export function prismaCollectionToEntity(
	model: PrismaCollection,
	pt: PrismaTopic,
	owner: User,
) {
	return {
		owner,
		id: model.id,
		name: model.name,
		topic: prismaTopicToEntity(pt),
		imageOption: nullableToOption(model.image),
	};
}

export function prismaCollectionFieldToEntity(
	model: PrismaCollectionField,
	collection: Collection,
): CollectionField {
	return {
		collection,
		id: model.id,
		name: model.name,
		type: model.type,
	};
}
