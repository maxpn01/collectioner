import { Err, None, Ok, Option, Result } from "ts-results";
import { User, UserRepository } from "../user";
import { BadRequestFailure, Failure, NotFoundFailure } from "../utils/failure";
import { Item } from "./item";
import { RepoGetIncludedProperties, RepoGetOptions } from "../utils/repository";
import { PrismaClient } from "@prisma/client";

export {
	Collection as PrismaCollection,
	Topic as PrismaTopic,
} from "@prisma/client";

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

type GetCollectionIncludables = {
	items: Item[];
	fields: CollectionField[];
};
type GetCollectionOptions = RepoGetOptions<GetCollectionIncludables>;
type GetCollectionResult<O extends GetCollectionOptions> = {
	collection: Collection;
} & RepoGetIncludedProperties<GetCollectionIncludables, O>;

export interface CollectionRepository {
	get<O extends GetCollectionOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>, Failure>>;
	getByUser<O extends GetCollectionOptions>(
		email: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>[], Failure>>;
	create(collection: Collection): Promise<Result<None, Failure>>;
	update(id: string, collection: Collection): Promise<Result<None, Failure>>;
	updateImage(
		id: string,
		imageOption: Option<string>,
	): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

class PrismaCollectionRepository implements CollectionRepository {
	constructor(private prisma: PrismaClient) {}

	async get<O extends GetCollectionOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>, Failure>> {
		throw new Error("Not implemented");
	}

	async getByUser<O extends GetCollectionOptions>(
		email: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>[], Failure>> {
		throw new Error("Not implemented");
	}

	async create(collection: Collection): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}

	async update(
		id: string,
		collection: Collection,
	): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}

	updateImage(
		id: string,
		imageOption: Option<string>,
	): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}
}

export interface TopicRepository {
	get(id: string): Promise<Result<Topic, Failure>>;
}

class PrismaTopicRepository implements TopicRepository {
	constructor(private prisma: PrismaClient) {}

	async get(id: string): Promise<Result<Topic, Failure>> {
		const topic = await this.prisma.topic.findUnique({ where: { id } });
		if (!topic) return Err(new NotFoundFailure());
		return Ok(topic);
	}
}

export class MemoryTopicRepository implements TopicRepository {
	topics: Topic[];

	constructor(topics: Topic[]) {
		this.topics = topics;
	}

	async get(id: string): Promise<Result<Topic, Failure>> {
		const topic = this.topics.find((t) => t.id === id);
		if (!topic) return Err(new NotFoundFailure());
		return Ok(topic);
	}
}

export type UpdatedField = { id: string; field: CollectionField };

export interface CollectionFieldRepository {
	get(id: string): Promise<Result<CollectionField, Failure>>;
	getByCollection(id: string): Promise<Result<CollectionField[], Failure>>;
	has(id: string): Promise<boolean>;
	create(field: CollectionField): Promise<Result<None, Failure>>;
	createMany(fields: CollectionField[]): Promise<Result<None, Failure>>;
	update(id: string, field: CollectionField): Promise<Result<None, Failure>>;
	updateMany(updatedFields: UpdatedField[]): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

class PrismaCollectionFieldRepository implements CollectionFieldRepository {
	constructor(private prisma: PrismaClient) {}

	async get(id: string): Promise<Result<CollectionField, Failure>> {
		throw new Error("Not implemented");
	}

	async getByCollection(
		collectionId: string,
	): Promise<Result<CollectionField[], Failure>> {
		throw new Error("Not implemented");
	}

	async has(id: string): Promise<boolean> {
		throw new Error("Not implemented");
	}

	async create(field: CollectionField): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}

	async createMany(fields: CollectionField[]): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}

	async update(
		id: string,
		field: CollectionField,
	): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}

	async updateMany(
		updatedFields: UpdatedField[],
	): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		throw new Error("Not implemented");
	}
}
