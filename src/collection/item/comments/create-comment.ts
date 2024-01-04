import { Result, None, Ok } from "ts-results";
import { Comment, CommentRepository } from ".";
import { Item, ItemRepository } from "..";
import { CollectionRepository } from "../..";
import { User, UserRepository } from "../../../user";
import { Failure } from "../../../utils/failure";
import { AuthorizeCollectionUpdateUseCase } from "../../update-collection";
import { nanoid } from "nanoid";

function generateItemId(): string {
	return nanoid();
}

function createNewComment({
	item,
	author,
	text,
}: {
	item: Item;
	author: User;
	text: string;
}): Comment {
	return {
		item,
		author,
		text,
		id: generateItemId(),
		createdAt: new Date(),
	};
}

type CreateCommentRequest = {
	collectionId: string;
	itemId: string;
	text: string;
};

export class CreateCommentUseCase {
	userRepository: UserRepository;
	itemRepository: ItemRepository;
	commentRepository: CommentRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdateUseCase;

	constructor(
		userRepository: UserRepository,
		collectionRepository: CollectionRepository,
		itemRepository: ItemRepository,
		commentRepository: CommentRepository,
	) {
		this.userRepository = userRepository;
		this.itemRepository = itemRepository;
		this.commentRepository = commentRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdateUseCase(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		request: CreateCommentRequest,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.authorizeCollectionUpdate.execute(
			request.collectionId,
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (collectionResult.err) return collectionResult;

		const itemResult = await this.itemRepository.get(request.itemId);
		if (itemResult.err) return itemResult;
		const item = itemResult.val;

		const userResult = await this.userRepository.get(requesterId);
		if (userResult.err) return userResult;
		const user = userResult.val;

		const comment: Comment = createNewComment({
			item,
			author: user,
			text: request.text,
		});

		const createCommentResult = await this.commentRepository.create(comment);
		if (createCommentResult.err) return createCommentResult;

		return Ok(None);
	}
}
