import { Collection, Topic } from ".";
import { nanoid } from "nanoid";
import { Err, None, Ok, Result } from "ts-results";
import { User, UserRepository } from "../user";
import { BadRequestFailure, Failure } from "../utils/failure";
import { NotAuthorizedFailure } from "../utils/failure";
import { CollectionRepository } from "./repositories/collection";
import { TopicRepository } from "./repositories/topic";
import { CollectionSearchEngine } from "./search-engine";
import { expressSendHttpFailure, httpFailurePresenter } from "../http";

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
		imageOption: None,
	};
}

function checkAllowedCreateCollection(requester: User, owner: User): boolean {
	return requester.id === owner.id || requester.isAdmin;
}

type CreateCollectionRequest = {
	ownerId: string;
	name: string;
	topicId: string;
};

export class CreateCollectionUseCase {
	collectionRepository: CollectionRepository;
	collectionSearchEngine: CollectionSearchEngine;
	topicRepository: TopicRepository;
	userRepository: UserRepository;

	constructor(
		collectionRepository: CollectionRepository,
		collectionSearchEngine: CollectionSearchEngine,
		topicRepository: TopicRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.collectionSearchEngine = collectionSearchEngine;
		this.topicRepository = topicRepository;
		this.userRepository = userRepository;
	}

	async execute(
		request: CreateCollectionRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const { user: requester } = requesterResult.val;

		const ownerResult =
			request.ownerId === requester.id
				? Ok({ user: requester })
				: await this.userRepository.get(request.ownerId);
		if (ownerResult.err) return ownerResult;
		const { user: owner } = ownerResult.val;

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
			topic,
			name: request.name,
		});

		const createResult = await this.collectionRepository.create(collection);
		if (createResult.err) return createResult;

		const addDocumentResult = await this.collectionSearchEngine.add(collection);
		if (addDocumentResult.err) return addDocumentResult;

		return Ok(None);
	}
}

export function httpBodyCreateCollectionController(
	json: any,
): Result<CreateCollectionRequest, BadRequestFailure> {
	const isValid =
		typeof json.name === "string" &&
		typeof json.ownerId === "string" &&
		typeof json.topicId === "string";
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		name: json.name,
		ownerId: json.ownerId,
		topicId: json.topicId,
	});
}

import { Request, Response } from "express";

export class ExpressCreateCollection {
	createCollection: CreateCollectionUseCase;

	constructor(createCollection: CreateCollectionUseCase) {
		this.execute = this.execute.bind(this);
		this.createCollection = createCollection;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = httpBodyCreateCollectionController(req.body);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		//@ts-ignore
		const requesterId = req.session.userId;
		const createResult = await this.createCollection.execute(
			request,
			requesterId,
		);
		if (createResult.err) {
			const failure = createResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
