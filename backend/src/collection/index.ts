import { Err, None, Ok, Option, Result } from "ts-results";
import { User, UserRepository } from "../user";
import { Failure, NotFoundFailure } from "../utils/failure";

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

export interface CollectionRepository {
	get(id: string): Promise<Result<Collection, Failure>>;
	getByUser(userId: string): Promise<Result<Collection[], Failure>>;
	create(collection: Collection): Promise<Result<None, Failure>>;
	update(id: string, collection: Collection): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export class MemoryCollectionRepository implements CollectionRepository {
	collections: Collection[];
	userRepository: UserRepository;
	topicRepository: TopicRepository;

	constructor(
		collections: Collection[],
		userRepository: UserRepository,
		topicRepository: TopicRepository,
	) {
		this.collections = collections;
		this.userRepository = userRepository;
		this.topicRepository = topicRepository;
	}

	async get(id: string): Promise<Result<Collection, Failure>> {
		const collection = structuredClone(
			this.collections.find((c) => c.id === id),
		);
		if (!collection) return Err(new NotFoundFailure());

		const ownerResult = await this.userRepository.get(collection.owner.id);
		if (ownerResult.err) return ownerResult;
		const owner = ownerResult.val;
		collection.owner = owner;

		const topicResult = await this.topicRepository.get(collection.topic.id);
		if (topicResult.err) return topicResult;
		const topic = topicResult.val;
		collection.topic = topic;

		return Ok(collection);
	}

	async getByUser(userId: string): Promise<Result<Collection[], Failure>> {
		const collections: Collection[] = [];

		for (const collection of this.collections) {
			if (collection.owner.id === userId) {
				const collectionResult = await this.get(collection.id);
				if (collectionResult.err) return collectionResult;
				collections.push(collectionResult.val);
			}
		}

		return Ok(collections);
	}

	async create(collection: Collection): Promise<Result<None, Failure>> {
		this.collections.push(collection);
		return Ok(None);
	}

	async update(
		id: string,
		collection: Collection,
	): Promise<Result<None, Failure>> {
		const index = this.collections.findIndex((c) => c.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.collections[index] = collection;
		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const index = this.collections.findIndex((c) => c.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.collections.splice(index, 1);
		return Ok(None);
	}
}

export interface TopicRepository {
	get(id: string): Promise<Result<Topic, Failure>>;
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

export interface CollectionFieldRepository {
	getByCollection(id: string): Promise<Result<CollectionField[], Failure>>;
	get(id: string): Promise<Result<CollectionField, Failure>>;
	has(id: string): Promise<boolean>;
	create(field: CollectionField): Promise<Result<None, Failure>>;
	update(id: string, field: CollectionField): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export class MemoryCollectionFieldRepository
	implements CollectionFieldRepository
{
	collectionFields: CollectionField[];
	collectionRepository: CollectionRepository;

	constructor(
		collectionFields: CollectionField[],
		collectionRepository: CollectionRepository,
	) {
		this.collectionFields = collectionFields;
		this.collectionRepository = collectionRepository;
	}

	async getByCollection(
		collectionId: string,
	): Promise<Result<CollectionField[], Failure>> {
		const fields = structuredClone(
			this.collectionFields.filter((f) => f.collection.id === collectionId),
		);
		if (!fields) return Err(new NotFoundFailure());

		const collectionResult = await this.collectionRepository.get(collectionId);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		for (const field of fields) {
			field.collection = collection;
		}

		return Ok(fields);
	}

	async has(id: string): Promise<boolean> {
		return this.collectionFields.some((f) => f.id === id);
	}

	async get(id: string): Promise<Result<CollectionField, Failure>> {
		const field = structuredClone(
			this.collectionFields.find((f) => f.id === id),
		);
		if (!field) return Err(new NotFoundFailure());

		const collectionResult = await this.collectionRepository.get(
			field.collection.id,
		);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		field.collection = collection;
		return Ok(field);
	}

	async create(field: CollectionField): Promise<Result<None, Failure>> {
		this.collectionFields.push(field);
		return Ok(None);
	}

	async update(
		id: string,
		field: CollectionField,
	): Promise<Result<None, Failure>> {
		const index = this.collectionFields.findIndex((f) => f.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.collectionFields[index] = field;
		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const index = this.collectionFields.findIndex((f) => f.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.collectionFields.splice(index, 1);
		return Ok(None);
	}
}
