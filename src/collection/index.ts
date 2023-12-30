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
export type ItemField = {
	id: string;
	name: string;
	collection: Collection;
	type: ItemFieldType;
};
export enum ItemFieldType {
	Number = "number",
	Text = "text",
	MultilineText = "multline-string",
	Checkbox = "checkbox",
	Date = "date",
}

export interface CollectionRepository {
	get(id: string): Promise<Result<Collection, Failure>>;
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

export interface ItemFieldRepository {
	getByCollection(id: string): Promise<Result<ItemField[], Failure>>;
	get(id: string): Promise<Result<ItemField, Failure>>;
	has(id: string): Promise<boolean>;
	create(field: ItemField): Promise<Result<None, Failure>>;
	update(id: string, field: ItemField): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export class MemoryItemFieldRepository implements ItemFieldRepository {
	itemFields: ItemField[];

	constructor(itemFields: ItemField[]) {
		this.itemFields = itemFields;
	}

	async getByCollection(id: string): Promise<Result<ItemField[], Failure>> {
		const fields = this.itemFields.filter((f) => f.collection.id === id);
		if (!fields) return Err(new NotFoundFailure());
		return Ok(fields);
	}

	async has(id: string): Promise<boolean> {
		return this.itemFields.some((f) => f.id === id);
	}

	async get(id: string): Promise<Result<ItemField, Failure>> {
		const field = this.itemFields.find((f) => f.id === id);
		if (!field) return Err(new NotFoundFailure());
		return Ok(field);
	}

	async create(field: ItemField): Promise<Result<None, Failure>> {
		this.itemFields.push(field);
		return Ok(None);
	}

	async update(id: string, field: ItemField): Promise<Result<None, Failure>> {
		const index = this.itemFields.findIndex((f) => f.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.itemFields[index] = field;
		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const index = this.itemFields.findIndex((f) => f.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.itemFields.splice(index, 1);
		return Ok(None);
	}
}
