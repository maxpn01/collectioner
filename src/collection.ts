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
	numberFields: ItemField[];
	textFields: ItemField[];
	multilineTextFields: ItemField[];
	checkboxFields: ItemField[];
	dateFields: ItemField[];
};
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
type ItemField = {
	id: string;
	name: string;
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
		numberFields: [],
		textFields: [],
		multilineTextFields: [],
		checkboxFields: [],
		dateFields: [],
	};
}

function checkAllowedCreateCollection(requester: User, owner: User): boolean {
	return requester.id === owner.id || requester.isAdmin;
}

function updateCollection(
	{
		name,
		topic,
		numberFields,
		textFields,
		multilineTextFields,
		checkboxFields,
		dateFields,
	}: {
		name: string;
		topic: Topic;
		numberFields: ItemField[];
		textFields: ItemField[];
		multilineTextFields: ItemField[];
		checkboxFields: ItemField[];
		dateFields: ItemField[];
	},
	collection: Collection,
): Collection {
	collection = structuredClone(collection);

	collection.name = name;
	collection.topic = topic;
	collection.numberFields = numberFields;
	collection.textFields = textFields;
	collection.multilineTextFields = multilineTextFields;
	collection.checkboxFields = checkboxFields;
	collection.dateFields = dateFields;

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
	userRepository: MemoryUserRepository;
	topicRepository: TopicRepository;

	constructor(
		collections: Collection[],
		userRepository: MemoryUserRepository,
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

type UpdateCollectionRequestItemField = {
	id: string;
	name: string;
};

type UpdateCollectionRequest = {
	name: string;
	topicId: string;
	numberFields: UpdateCollectionRequestItemField[];
	textFields: UpdateCollectionRequestItemField[];
	multilineTextFields: UpdateCollectionRequestItemField[];
	checkboxFields: UpdateCollectionRequestItemField[];
	dateFields: UpdateCollectionRequestItemField[];
};

class UpdateCollectionUseCase {
	collectionRepository: CollectionRepository;
	topicRepository: TopicRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdateUseCase;

	constructor(
		collectionRepository: CollectionRepository,
		topicRepository: TopicRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.topicRepository = topicRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdateUseCase(
			collectionRepository,
			userRepository,
		);
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

		const updatedCollection = updateCollection(
			{
				name: request.name,
				topic,
				numberFields: request.numberFields,
				textFields: request.textFields,
				multilineTextFields: request.multilineTextFields,
				checkboxFields: request.checkboxFields,
				dateFields: request.dateFields,
			},
			collection,
		);

		const updateResult = await this.collectionRepository.update(
			id,
			updatedCollection,
		);
		if (updateResult.err) return updateResult;

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
