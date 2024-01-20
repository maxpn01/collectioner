import { CollectionFieldType, Topic, CollectionField, Collection } from ".";
import { nanoid } from "nanoid";
import { Err, None, Ok, Option, Result } from "ts-results";
import { UserRepository, authorizeUserUpdate } from "../user";
import { Failure, NotFoundFailure } from "../utils/failure";
import { NotAuthorizedFailure } from "../utils/failure";
import { CollectionRepository } from "./repositories/collection";
import { TopicRepository } from "./repositories/topic";
import {
	CollectionFieldRepository,
	UpdatedField,
} from "./repositories/collection-field";
import { CollectionSearchEngine } from "./search-engine";

function updateCollection(
	collection: Collection,
	{
		name,
		topic,
		imageOption,
	}: {
		name: string;
		topic: Topic;
		imageOption: Option<string>;
	},
): Collection {
	collection = structuredClone(collection);

	collection.name = name;
	collection.topic = topic;
	collection.imageOption = imageOption;

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

export type UpdateCollectionRequest = {
	name: string;
	topicId: string;
	imageOption: Option<string>;
	fields: UpdateCollectionRequestField[];
	newFields: UpdateCollectionRequestNewField[];
};

export type UpdateCollectionRequestField = {
	id: string;
	name: string;
	type: CollectionFieldType;
};

export type UpdateCollectionRequestNewField = {
	name: string;
	type: CollectionFieldType;
};

export class UpdateCollectionUseCase {
	collectionRepository: CollectionRepository;
	collectionSearchEngine: CollectionSearchEngine;
	topicRepository: TopicRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;
	collectionFieldRepository: CollectionFieldRepository;

	constructor(
		collectionRepository: CollectionRepository,
		collectionSearchEngine: CollectionSearchEngine,
		topicRepository: TopicRepository,
		userRepository: UserRepository,
		collectionFieldRepository: CollectionFieldRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.collectionSearchEngine = collectionSearchEngine;
		this.topicRepository = topicRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
		this.collectionFieldRepository = collectionFieldRepository;
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

		const updateCollectionFieldsResult = await this.updateCollectionFields(
			request,
			collection,
			fields,
		);
		if (updateCollectionFieldsResult.err) return updateCollectionFieldsResult;

		const updatedCollection = updateCollection(collection, {
			name: request.name,
			topic,
			imageOption: request.imageOption,
		});

		const updateResult = await this.collectionRepository.update(
			id,
			updatedCollection,
		);
		if (updateResult.err) return updateResult;

		const replaceResult = await this.collectionSearchEngine.replace(
			updatedCollection,
		);
		if (replaceResult.err) return replaceResult;

		return Ok(None);
	}

	async updateCollectionFields(
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

		const updateResult = await this.collectionFieldRepository.updateMany(
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

		const createResult = await this.collectionFieldRepository.createMany(
			createdFields,
		);
		if (createResult.err) return createResult;

		return Ok(None);
	}
}
