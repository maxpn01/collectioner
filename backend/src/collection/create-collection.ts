import { Collection, Topic } from ".";
import { nanoid } from "nanoid";
import { Err, None, Ok, Result } from "ts-results";
import { User, UserRepository } from "../user";
import { BadRequestFailure, Failure } from "../utils/failure";
import { NotAuthorizedFailure } from "../user/view-user";
import { CollectionRepository } from "./repositories/collection";
import { TopicRepository } from "./repositories/topic";
import { CollectionSearchEngine } from "./search-engine";

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

export class JsonCreateCollectionController {
	execute(json: any): Result<CreateCollectionRequest, Failure> {
		let name = json.name as string;
		name = name.trim();

		if (name.length === 0) return Err(new BadRequestFailure());

		return Ok({
			name,
			ownerId: json.ownerId,
			topicId: json.topicId,
		});
	}
}
