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

function checkAllowedUpdateCollection(user: User, collection: Collection) {
	const isOwner = user.id === collection.owner.id;

	return isOwner || user.isAdmin;
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
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		if (!checkSenderIsAuthenticated()) return Err(new NotAuthorizedFailure());

		const topicResult = this.topicRepository.get(request.topicId);
		if (topicResult.err) return topicResult;
		const topic = topicResult.val;

		const ownerResult = await this.userRepository.get(senderId);
		if (ownerResult.err) return ownerResult;
		const owner = ownerResult.val;

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
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		if (!checkSenderIsAuthenticated()) return Err(new NotAuthorizedFailure());

		const senderResult = await this.userRepository.get(senderId);
		if (senderResult.err) return senderResult;
		const sender = senderResult.val;

		const collectionResult = await this.collectionRepository.get(id);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		const allowedUpdateCollection = checkAllowedUpdateCollection(
			sender,
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
