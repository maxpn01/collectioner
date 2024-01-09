import { Result, None, Ok } from "ts-results";
import { Comment, CommentRepository } from ".";
import { Item, ItemRepository } from "..";
import { User, UserRepository } from "../../../user";
import { Failure } from "../../../utils/failure";
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
	itemId: string;
	text: string;
};

export class CreateCommentUseCase {
	userRepository: UserRepository;
	itemRepository: ItemRepository;
	commentRepository: CommentRepository;

	constructor(
		userRepository: UserRepository,
		itemRepository: ItemRepository,
		commentRepository: CommentRepository,
	) {
		this.userRepository = userRepository;
		this.itemRepository = itemRepository;
		this.commentRepository = commentRepository;
	}

	async execute(
		request: CreateCommentRequest,
		commenterId: string,
	): Promise<Result<None, Failure>> {
		const itemResult = await this.itemRepository.get(request.itemId);
		if (itemResult.err) return itemResult;
		const { item } = itemResult.val;

		const commenterResult = await this.userRepository.get(commenterId);
		if (commenterResult.err) return commenterResult;
		const { user: commenter } = commenterResult.val;

		const comment: Comment = createNewComment({
			item,
			author: commenter,
			text: request.text,
		});

		const createCommentResult = await this.commentRepository.create(comment);
		if (createCommentResult.err) return createCommentResult;

		return Ok(None);
	}
}
