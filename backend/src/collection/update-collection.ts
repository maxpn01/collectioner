import {
	CollectionFieldType,
	Topic,
	TopicRepository,
	CollectionField,
	Collection,
	CollectionRepository,
	CollectionFieldRepository,
	UpdatedField,
} from ".";
import { nanoid } from "nanoid";
import { Err, None, Ok, Option, Result } from "ts-results";
import { UserRepository, authorizeUserUpdate } from "../user";
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

export class AuthorizeCollectionUpdate {
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
		collection: Collection,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const ownerId = collection.owner.id;
		if (requesterId !== ownerId) {
			const requesterResult = await this.userRepository.get(requesterId);
			if (requesterResult.err) throw new Error();
			const { user: requester } = requesterResult.val;
			const authorized = authorizeUserUpdate(ownerId, requester);
			if (!authorized) return Err(new NotAuthorizedFailure());
		}

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
	type: CollectionFieldType;
};

type UpdateCollectionRequestNewItemField = {
	name: string;
	type: CollectionFieldType;
};

class UpdateCollectionUseCase {
	collectionRepository: CollectionRepository;
	topicRepository: TopicRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;
	itemFieldRepository: CollectionFieldRepository;

	constructor(
		collectionRepository: CollectionRepository,
		topicRepository: TopicRepository,
		userRepository: UserRepository,
		itemFieldRepository: CollectionFieldRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.topicRepository = topicRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
		this.itemFieldRepository = itemFieldRepository;
	}

	async execute(
		id: string,
		request: UpdateCollectionRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.collectionRepository.get(id, {
			include: { fields: true },
		});
		if (collectionResult.err) return collectionResult;
		const { collection, fields } = collectionResult.val;

		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			collection,
			requesterId,
		);
		if (authorizeResult.err) return authorizeResult;

		let topic = collection.topic;
		const shouldUpdateTopic = request.topicId !== topic.id;
		if (shouldUpdateTopic) {
			const topicResult = await this.topicRepository.get(request.topicId);
			if (topicResult.err) return topicResult;
			topic = topicResult.val;
		}

		const updateItemFieldsResult = await this.updateItemFields(
			request,
			collection,
			fields,
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
		fields: CollectionField[],
	): Promise<Result<None, Failure>> {
		const updatedFields: UpdatedField[] = [];

		for (let i = 0; i < request.fields.length; i++) {
			const field = request.fields[i];
			const index = fields.findIndex((f) => f.id === field.id);
			const fieldExists = index > -1;
			if (!fieldExists) return Err(new NotFoundFailure());

			const updatedField: CollectionField = { collection, ...field };

			updatedFields.push({
				id: field.id,
				field: updatedField,
			});
		}

		const updateResult = await this.itemFieldRepository.updateMany(
			updatedFields,
		);
		if (updateResult.err) return updateResult;

		const createdFields: CollectionField[] = [];

		for (let i = 0; i < request.newFields.length; i++) {
			const field = request.newFields[i];
			const createdField: CollectionField = {
				id: generateItemFieldId(),
				collection,
				...field,
			};

			createdFields.push(createdField);
		}

		const createResult = await this.itemFieldRepository.createMany(
			createdFields,
		);
		if (createResult.err) return createResult;

		return Ok(None);
	}
}

export class SetCollectionImageUseCase {
	collectionRepository: CollectionRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;

	constructor(
		collectionRepository: CollectionRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		imageOption: Option<string>,
		collectionId: string,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.collectionRepository.get(collectionId);
		if (collectionResult.err) return collectionResult;
		const { collection } = collectionResult.val;

		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			collection,
			requesterId,
		);
		if (authorizeResult.err) return authorizeResult;

		const updateResult = await this.collectionRepository.updateImage(
			collection.id,
			imageOption,
		);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}
