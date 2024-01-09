import { Collection, CollectionRepository, Topic, TopicRepository } from ".";
import { nanoid } from "nanoid";
import { Err, None, Ok, Result } from "ts-results";
import { User, UserRepository } from "../user";
import { Failure } from "../utils/failure";
import { NotAuthorizedFailure } from "../user/view-user";

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
