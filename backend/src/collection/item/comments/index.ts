import { Result, None } from "ts-results";
import { Item } from "..";
import { User } from "../../../user";
import { Failure } from "../../../utils/failure";
import { PrismaClient } from "@prisma/client";

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

class PrismaCommentRepository implements CommentRepository {
	constructor(private prisma: PrismaClient) {}

	get(id: string): Promise<Result<Comment, Failure>> {
		throw new Error("Method not implemented.");
	}
	getByItem(itemId: string): Promise<Result<Comment[], Failure>> {
		throw new Error("Method not implemented.");
	}
	create(comment: Comment): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}
	update(comment: Comment): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}
	delete(id: string): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}
	deleteByItem(itemId: string): Promise<Result<None, Failure>> {
		throw new Error("Method not implemented.");
	}
}
