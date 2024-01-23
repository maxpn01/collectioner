import {
	CollectionFieldType,
	Topic,
	CollectionField,
	Collection,
	CollectionFieldNameIsTakenFailure,
	CollectionNameIsTakenFailure,
	ValidateCollectionNameFailure,
	validateCollectionName,
} from ".";
import { nanoid } from "nanoid";
import { Err, None, Ok, Option, Result } from "ts-results";
import { UserRepository, authorizeUserUpdate } from "../user";
import {
	BadRequestFailure,
	Failure,
	NotFoundFailure,
	ValidateLengthFailure,
} from "../utils/failure";
import { NotAuthorizedFailure } from "../utils/failure";
import { CollectionRepository } from "./repositories/collection";
import { TopicRepository } from "./repositories/topic";
import {
	CollectionFieldRepository,
	UpdatedField,
} from "./repositories/collection-field";
import { CollectionSearchEngine } from "./search-engine";

export class ValidateCollectionFieldNameFailure extends ValidateLengthFailure {}

export function validateCollectionFieldName(
	collectionFieldName: string,
): Result<None, ValidateCollectionFieldNameFailure> {
	const satisfiesMinLength = collectionFieldName.length >= 1;
	const satisfiesMaxLength = collectionFieldName.length <= 25;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid) {
		return Err(
			new ValidateCollectionFieldNameFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
			}),
		);
	}

	return Ok(None);
}

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
): Result<Collection, Failure> {
	const validateCollectionNameResult = validateCollectionName(name);
	if (validateCollectionNameResult.err) return validateCollectionNameResult;

	collection = structuredClone(collection);

	collection.name = name;
	collection.topic = topic;
	collection.imageOption = imageOption;

	return Ok(collection);
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
	id: string;
	name: string;
	topicId: string;
	imageOption: Option<string>;
	updatedFields: UpdateCollectionRequestField[];
	createdFields: UpdateCollectionRequestNewField[];
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
		request: UpdateCollectionRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.collectionRepository.get(request.id, {
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
		const updatedFields: CollectionField[] = updateCollectionFieldsResult.val;

		const updatedCollectionResult = updateCollection(collection, {
			name: request.name,
			topic,
			imageOption: request.imageOption,
		});
		if (updatedCollectionResult.err) return updatedCollectionResult;
		const updatedCollection = updatedCollectionResult.val;

		const updateResult = await this.collectionRepository.update(
			request.id,
			updatedCollection,
		);
		if (updateResult.err) return updateResult;

		const replaceResult = await this.collectionSearchEngine.replace(
			updatedCollection,
			updatedFields,
		);
		if (replaceResult.err) return replaceResult;

		return Ok(None);
	}

	async updateCollectionFields(
		request: UpdateCollectionRequest,
		collection: Collection,
		fields: CollectionField[],
	): Promise<Result<CollectionField[], Failure>> {
		const updatedFields: UpdatedField[] = [];

		for (let i = 0; i < request.updatedFields.length; i++) {
			const field = request.updatedFields[i];
			const index = fields.findIndex((f) => f.id === field.id);

			const fieldExists = index > -1;
			if (!fieldExists) return Err(new NotFoundFailure());

			const validateCollectionFieldNameResult = validateCollectionFieldName(
				field.name,
			);
			if (validateCollectionFieldNameResult.err)
				return validateCollectionFieldNameResult;

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

		for (let i = 0; i < request.createdFields.length; i++) {
			const field = request.createdFields[i];

			const validateCollectionFieldNameResult = validateCollectionFieldName(
				field.name,
			);
			if (validateCollectionFieldNameResult.err)
				return validateCollectionFieldNameResult;

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

		const result: CollectionField[] = [
			...updatedFields.map((uf) => uf.field),
			...createdFields,
		];

		return Ok(result);
	}
}

function isUpdateCollectionRequestField(
	obj: any,
): obj is UpdateCollectionRequestField {
	return (
		typeof obj === "object" &&
		typeof obj.id === "string" &&
		typeof obj.name === "string" &&
		CollectionFieldType.hasOwnProperty(obj.type)
	);
}

function isUpdateCollectionRequestNewField(
	obj: any,
): obj is UpdateCollectionRequestNewField {
	return (
		typeof obj === "object" &&
		typeof obj.name === "string" &&
		CollectionFieldType.hasOwnProperty(obj.type)
	);
}

export function jsonUpdateCollectionController(
	json: any,
): Result<UpdateCollectionRequest, BadRequestFailure> {
	const isValidUpdatedFields =
		(Array.isArray(json.updatedFields) &&
			json.updatedFields.every(isUpdateCollectionRequestField)) ||
		json.updatedFields.length === 0;
	const isValidCreatedFields =
		(Array.isArray(json.createdFields) &&
			json.createdFields.every(isUpdateCollectionRequestNewField)) ||
		json.createdFields.length === 0;
	const isValid =
		typeof json.id === "string" &&
		typeof json.name === "string" &&
		typeof json.topicId === "string" &&
		typeof json.imageOption === "string" &&
		isValidUpdatedFields &&
		isValidCreatedFields;
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		id: json.id,
		name: json.name,
		topicId: json.topicId,
		imageOption: json.imageOption,
		updatedFields: json.updatedFields,
		createdFields: json.createdFields,
	});
}

import { Request, Response } from "express";
import {
	HttpFailure,
	JsonHttpFailure,
	expressSendHttpFailure,
	httpFailurePresenter,
} from "../http";

export function updateCollectionHttpFailurePresenter(
	failure: Failure,
): HttpFailure {
	if (failure instanceof ValidateCollectionNameFailure) {
		return new JsonHttpFailure(422, {
			satisfiedMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
		});
	}

	if (failure instanceof ValidateCollectionFieldNameFailure) {
		return new JsonHttpFailure(422, {
			satisfiedMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
		});
	}

	if (failure instanceof CollectionNameIsTakenFailure) {
		return new JsonHttpFailure(409, {
			collectionNameIsTaken: true,
		});
	}

	if (failure instanceof CollectionFieldNameIsTakenFailure) {
		return new JsonHttpFailure(409, {
			collectionFieldNameIsTaken: true,
		});
	}

	return httpFailurePresenter(failure);
}

export class ExpressUpdateCollection {
	updateCollection: UpdateCollectionUseCase;

	constructor(updateCollection: UpdateCollectionUseCase) {
		this.execute = this.execute.bind(this);
		this.updateCollection = updateCollection;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;

		const controllerResult = jsonUpdateCollectionController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		//@ts-ignore
		const requesterId = req.session.userId;

		const updateResult = await this.updateCollection.execute(
			request,
			requesterId,
		);
		if (updateResult.err) {
			const failure = updateResult.val;
			const httpFailure = updateCollectionHttpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
