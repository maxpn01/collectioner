import {
	ItemFieldType,
	Topic,
	TopicRepository,
	ItemField,
	Collection,
	CollectionRepository,
	ItemFieldRepository,
} from ".";
import { nanoid } from "nanoid";
import { Err, None, Ok, Option, Result } from "ts-results";
import {
	AuthorizeUserUpdateUseCase,
	User,
	UserRepository,
	authorizeUserUpdate,
} from "../user";
import { Failure, NotFoundFailure } from "../utils/failure";
import { NotAuthorizedFailure } from "../user/view-user";

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

export class AuthorizeCollectionUpdateUseCase {
	collectionRepository: CollectionRepository;
	userRepository: UserRepository;
	authorizeUserUpdateUseCase: AuthorizeUserUpdateUseCase;

	constructor(
		collectionRepository: CollectionRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.userRepository = userRepository;
		this.authorizeUserUpdateUseCase = new AuthorizeUserUpdateUseCase(
			userRepository,
		);
	}

	async execute(
		id: string,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<Collection, Failure>> {
		const authorized = await this.authorizeUserUpdateUseCase.execute(
			id,
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (!authorized) return Err(new NotAuthorizedFailure());

		const collectionResult = await this.collectionRepository.get(id);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		return Ok(collection);
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
