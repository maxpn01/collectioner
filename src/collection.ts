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
