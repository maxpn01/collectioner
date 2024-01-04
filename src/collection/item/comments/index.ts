import { Result, None, Err, Ok } from "ts-results";
import { Item, ItemRepository } from "..";
import { User } from "../../../user";
import { Failure, NotFoundFailure } from "../../../utils/failure";

export type Comment = {
	item: Item;
	id: string;
	author: User;
	text: string;
	createdAt: Date;
};

export interface CommentRepository {
	getByItem(itemId: string): Promise<Result<Comment[], Failure>>;
	deleteByItem(itemId: string): Promise<Result<None, Failure>>;
	get(id: string): Promise<Result<Comment, Failure>>;
	create(comment: Comment): Promise<Result<None, Failure>>;
	update(comment: Comment): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export class MemoryCommentRepository implements CommentRepository {
	comments: Comment[];
	itemRepository: ItemRepository;

	constructor(comments: Comment[], itemRepository: ItemRepository) {
		this.comments = comments;
		this.itemRepository = itemRepository;
	}

	async getByItem(itemId: string): Promise<Result<Comment[], Failure>> {
		const comments = structuredClone(
			this.comments.filter((c) => c.item.id === itemId),
		);

		const itemResult = await this.itemRepository.get(itemId);
		if (itemResult.err) return itemResult;
		const item = itemResult.val;

		for (const comment of comments) {
			comment.item = item;
		}

		return Ok(comments);
	}

	async deleteByItem(itemId: string): Promise<Result<None, Failure>> {
		this.comments = this.comments.filter((c) => c.item.id !== itemId);
		return Ok(None);
	}

	async get(id: string): Promise<Result<Comment, Failure>> {
		const comment = this.comments.find((c) => c.id === id);
		if (!comment) return Err(new NotFoundFailure());
		return Ok(comment);
	}

	async create(comment: Comment): Promise<Result<None, Failure>> {
		this.comments.push(comment);
		return Ok(None);
	}

	async update(comment: Comment): Promise<Result<None, Failure>> {
		const index = this.comments.findIndex((c) => c.id === comment.id);
		if (index === -1) return Err(new NotFoundFailure());
		this.comments[index] = comment;
		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const index = this.comments.findIndex((c) => c.id === id);
		if (index === -1) return Err(new NotFoundFailure());

		this.comments.splice(index, 1);
		return Ok(None);
	}
}
