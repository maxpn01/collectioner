import {
	User,
	NotAuthorizedFailure,
	UserRepository,
	MemoryUserRepository,
} from "./user";
import { Result, Ok, Err, Option, Some, None } from "ts-results";
import { Failure, NotFoundFailure } from "./utils/failure";
import { nanoid } from "nanoid";

type Topic = {
	id: string;
	name: string;
};

type Collection = {
	owner: User;
	id: string;
	name: string;
	items: Item[];
	topic: Topic;
	imageOption: Option<string>;
};
type ItemField = {
	id: string;
	name: string;
	collection: Collection;
	type: ItemFieldType;
};
enum ItemFieldType {
	Number = "number",
	Text = "text",
	MultilineText = "multline-string",
	Checkbox = "checkbox",
	Date = "date",
}

type Item = {
	id: string;
	name: string;
	tags: string[];
	createdAt: Date;
	numberFields: NumberField[];
	textFields: TextField[];
	multilineTextFields: MultilineTextField[];
	checkboxFields: CheckboxField[];
	dateFields: DateField[];
	likes: Like[];
	comments: Comment[];
};
type NumberField = {
	id: string;
	field: ItemField;
	value: number;
};
type TextField = {
	id: string;
	field: ItemField;
	value: string;
};
type MultilineTextField = {
	id: string;
	field: ItemField;
	value: string;
};
type CheckboxField = {
	id: string;
	field: ItemField;
	value: boolean;
};
type DateField = {
	id: string;
	field: ItemField;
	value: Date;
};
type Comment = {
	id: string;
	author: User;
	text: string;
	createdAt: Date;
	// likes: Like[]; TODO: Implement if enough time
};

type Like = {
	author: User;
};

function generateCollectionId(): string {
	return nanoid();
}

function createNewCollection({
	owner,
	name,
	topic,
}: {
	owner: User;
	name: string;
	topic: Topic;
}): Collection {
	return {
		id: generateCollectionId(),
		owner,
		name,
		topic,
		items: [],
		imageOption: None,
	};
}

function checkAllowedCreateCollection(requester: User, owner: User): boolean {
	return requester.id === owner.id || requester.isAdmin;
}

function updateCollection(
	collection: Collection,
	{
		name,
		topic,
	}: {
		name: string;
		topic: Topic;
	},
): Collection {
	collection = structuredClone(collection);

	collection.name = name;
	collection.topic = topic;

	return collection;
}

function checkAllowedUpdateCollection(requester: User, collection: Collection) {
	const isOwner = requester.id === collection.owner.id;

	return isOwner || requester.isAdmin;
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

class AuthorizeCollectionUpdateUseCase {
	collectionRepository: CollectionRepository;
	userRepository: UserRepository;

	constructor(
		collectionRepository: CollectionRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.userRepository = userRepository;
	}

	async execute(
		id: string,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<Collection, Failure>> {
		if (!checkRequesterIsAuthenticated())
			return Err(new NotAuthorizedFailure());

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const requester = requesterResult.val;

		const collectionResult = await this.collectionRepository.get(id);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		const allowedUpdateCollection = checkAllowedUpdateCollection(
			requester,
			collection,
		);
		if (!allowedUpdateCollection) return Err(new NotAuthorizedFailure());

		return Ok(collection);
	}
}

type CreateCollectionRequest = {
	ownerId: string;
	name: string;
	topicId: string;
};

class CreateCollectionUseCase {
	collectionRepository: CollectionRepository;
	topicRepository: TopicRepository;
	userRepository: UserRepository;

	constructor(
		collectionRepository: CollectionRepository,
		topicRepository: TopicRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.topicRepository = topicRepository;
		this.userRepository = userRepository;
	}

	async execute(
		request: CreateCollectionRequest,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		if (!checkRequesterIsAuthenticated())
			return Err(new NotAuthorizedFailure());

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const requester = requesterResult.val;

		const ownerResult =
			request.ownerId === requester.id
				? Ok(requester)
				: await this.userRepository.get(request.ownerId);
		if (ownerResult.err) return ownerResult;
		const owner = ownerResult.val;

		const allowedCreateCollection = checkAllowedCreateCollection(
			requester,
			owner,
		);
		if (!allowedCreateCollection) return Err(new NotAuthorizedFailure());

		const topicResult = await this.topicRepository.get(request.topicId);
		if (topicResult.err) return topicResult;
		const topic = topicResult.val;

		const collection = createNewCollection({
			owner,
			name: request.name,
			topic,
		});

		const createResult = await this.collectionRepository.create(collection);
		if (createResult.err) return createResult;

		return Ok(None);
	}
}

function generateItemFieldId(): string {
	return nanoid();
}

type UpdateCollectionRequest = {
	name: string;
	topicId: string;
	fields: UpdateCollectionRequestItemField[];
	newFields: UpdateCollectionRequestNewItemField[];
};

type UpdateCollectionRequestItemField = {
	id: string;
	name: string;
	type: ItemFieldType;
};

type UpdateCollectionRequestNewItemField = {
	name: string;
	type: ItemFieldType;
};

class UpdateCollectionUseCase {
	collectionRepository: CollectionRepository;
	topicRepository: TopicRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdateUseCase;
	itemFieldRepository: ItemFieldRepository;

	constructor(
		collectionRepository: CollectionRepository,
		topicRepository: TopicRepository,
		userRepository: UserRepository,
		itemFieldRepository: ItemFieldRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.topicRepository = topicRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdateUseCase(
			collectionRepository,
			userRepository,
		);
		this.itemFieldRepository = itemFieldRepository;
	}

	async execute(
		id: string,
		request: UpdateCollectionRequest,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.authorizeCollectionUpdate.execute(
			id,
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		const topicResult = await this.topicRepository.get(request.topicId);
		if (topicResult.err) return topicResult;
		const topic = topicResult.val;

		const updateItemFieldsResult = await this.updateItemFields(
			request,
			collection,
		);
		if (updateItemFieldsResult.err) return updateItemFieldsResult;

		const updatedCollection = updateCollection(collection, {
			name: request.name,
			topic,
		});

		const updateResult = await this.collectionRepository.update(
			id,
			updatedCollection,
		);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}

	async updateItemFields(
		request: UpdateCollectionRequest,
		collection: Collection,
	): Promise<Result<None, Failure>> {
		for (let i = 0; i < request.fields.length; i++) {
			const field = request.fields[i];
			const fieldExists = await this.itemFieldRepository.has(field.id);
			if (!fieldExists) return Err(new NotFoundFailure());

			const updatedField: ItemField = { collection, ...field };
			await this.itemFieldRepository.update(field.id, updatedField);
		}

		for (let i = 0; i < request.newFields.length; i++) {
			const field = request.newFields[i];
			const createdField: ItemField = {
				id: generateItemFieldId(),
				collection,
				...field,
			};
			await this.itemFieldRepository.create(createdField);
		}

		return Ok(None);
	}
}

class DeleteCollectionUseCase {
	collectionRepository: CollectionRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdateUseCase;

	constructor(
		collectionRepository: CollectionRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdateUseCase(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		id: string,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			id,
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (authorizeResult.err) return authorizeResult;

		const deleteResult = await this.collectionRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}

function setCollectionImage(
	imageOption: Option<string>,
	collection: Collection,
): Collection {
	collection = structuredClone(collection);
	collection.imageOption = imageOption;
	return collection;
}

export class SetCollectionImageUseCase {
	collectionRepository: CollectionRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdateUseCase;

	constructor(
		collectionRepository: CollectionRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdateUseCase(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		imageOption: Option<string>,
		id: string,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.authorizeCollectionUpdate.execute(
			id,
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		const updatedCollection = setCollectionImage(imageOption, collection);

		const updateResult = await this.collectionRepository.update(
			id,
			updatedCollection,
		);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}
