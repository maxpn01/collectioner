import { Result, None, Ok } from "ts-results";
import { Comment, CommentRepository } from ".";
import { Item, ItemRepository } from "..";
import { User, UserRepository } from "../../../user";
import { Failure } from "../../../utils/failure";
import { nanoid } from "nanoid";
import { CommentSearchEngine } from "./search-engine";

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
	itemId: string;
	text: string;
};

export class CreateCommentUseCase {
	userRepository: UserRepository;
	itemRepository: ItemRepository;
	commentRepository: CommentRepository;
	commentSearchEngine: CommentSearchEngine;

	constructor(
		userRepository: UserRepository,
		itemRepository: ItemRepository,
		commentRepository: CommentRepository,
		commentSearchEngine: CommentSearchEngine,
	) {
		this.userRepository = userRepository;
		this.itemRepository = itemRepository;
		this.commentRepository = commentRepository;
		this.commentSearchEngine = commentSearchEngine;
	}

	async execute(
		request: CreateCommentRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const itemResult = await this.itemRepository.get(request.itemId);
		if (itemResult.err) return itemResult;
		const { item } = itemResult.val;

		const commenterResult = await this.userRepository.get(requesterId);
		if (commenterResult.err) return commenterResult;
		const { user: requester } = commenterResult.val;

		const comment: Comment = createNewComment({
			item,
			author: requester,
			text: request.text,
		});

		const createResult = await this.commentRepository.create(comment);
		if (createResult.err) return createResult;

		const addResult = await this.commentSearchEngine.add(comment);
		if (addResult.err) return addResult;

		return Ok(None);
	}
}
