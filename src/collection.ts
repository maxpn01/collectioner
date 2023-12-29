import { User, NotAuthorizedFailure, UserRepository } from "user";
import { Result, Ok, Err, Option, Some, None } from "ts-results";
import { Failure, NotFoundFailure } from "utils/failure";
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
	image: Option<Buffer>;
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
		image: None,
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
	collection: Collection,
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
): Collection {
	return {
		id: collection.id,
		owner: collection.owner,
		items: collection.items,
		image: collection.image,
		name,
		topic,
		numberFields,
		textFields,
		multilineTextFields,
		checkboxFields,
		dateFields,
	};
}

function checkAllowedUpdateCollection(requester: User, collection: Collection) {
	const isOwner = requester.id === collection.owner.id;

	return isOwner || requester.isAdmin;
}

interface TopicRepository {
	get(id: string): Result<Topic, Failure>;
}

interface CollectionRepository {
	get(id: string): Promise<Result<Collection, Failure>>;
	create(collection: Collection): Promise<Result<None, Failure>>;
	update(id: string, collection: Collection): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
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

		const topicResult = this.topicRepository.get(request.topicId);
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
		id: string,
		request: UpdateCollectionRequest,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
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

		const topicResult = this.topicRepository.get(request.topicId);
		if (topicResult.err) return topicResult;
		const topic = topicResult.val;

		const updatedCollection = updateCollection(collection, {
			name: request.name,
			topic,
			numberFields: request.numberFields,
			textFields: request.textFields,
			multilineTextFields: request.multilineTextFields,
			checkboxFields: request.checkboxFields,
			dateFields: request.dateFields,
		});

		const updateResult = await this.collectionRepository.update(
			id,
			updatedCollection,
		);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}
