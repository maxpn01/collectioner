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
	get(id: string): Promise<Result<Comment, Failure>>;
	getByItem(itemId: string): Promise<Result<Comment[], Failure>>;
	create(comment: Comment): Promise<Result<None, Failure>>;
	update(comment: Comment): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
	deleteByItem(itemId: string): Promise<Result<None, Failure>>;
}

export class MemoryCommentRepository implements CommentRepository {
	comments: Comment[];
	itemRepository: ItemRepository;

	constructor(comments: Comment[], itemRepository: ItemRepository) {
		this.comments = comments;
		this.itemRepository = itemRepository;
	}

	async get(id: string): Promise<Result<Comment, Failure>> {
		throw new Error("Not implemented");
	}

	async getByItem(itemId: string): Promise<Result<Comment[], Failure>> {
		throw new Error("Not implemented");
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

	async deleteByItem(itemId: string): Promise<Result<None, Failure>> {
		this.comments = this.comments.filter((c) => c.item.id !== itemId);
		return Ok(None);
	}
}
