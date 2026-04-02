import { Result, None, Err, Ok } from "ts-results";
import { Item, prismaItemToEntity } from "..";
import { PrismaUser, User, prismaUserToEntity } from "../../../user";
import {
	Failure,
	NotFoundFailure,
	ValidateLengthFailure,
} from "../../../utils/failure";
import { PrismaClient, Comment as PrismaComment } from "@prisma/client";
import { prismaCollectionToEntity } from "../..";
import { HttpFailure, JsonHttpFailure } from "../../../http";

export type Comment = {
	item: Item;
	id: string;
	author: User;
	text: string;
	createdAt: Date;
};

export class ValidateCommentTextFailure extends ValidateLengthFailure {}

export function validateCommentTextHttpFailurePresenter(
	failure: ValidateCommentTextFailure,
): HttpFailure {
	return new JsonHttpFailure(422, {
		satisfiesMinLength: failure.satisfiesMinLength,
		satisfiesMaxLength: failure.satisfiesMaxLength,
	});
}

export function validateCommentText(
	text: string,
): Result<None, ValidateCommentTextFailure> {
	const satisfiesMinLength = text.length >= 1;
	const satisfiesMaxLength = text.length <= 400;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid) {
		return Err(
			new ValidateCommentTextFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
			}),
		);
	}

	return Ok(None);
}

export interface CommentRepository {
	get(id: string): Promise<Result<Comment, Failure>>;
	getByItem(itemId: string): Promise<Result<Comment[], Failure>>;
	create(comment: Comment): Promise<Result<None, Failure>>;
	update(comment: Comment): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
	deleteByItem(itemId: string): Promise<Result<None, Failure>>;
}

export class PrismaCommentRepository implements CommentRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async get(id: string): Promise<Result<Comment, Failure>> {
		const prismaComment = await this.prisma.comment.findUnique({
			where: { id },
			include: {
				item: {
					include: {
						collection: {
							include: {
								owner: true,
								topic: true,
							},
						},
						tags: true,
					},
				},
				author: true,
			},
		});
		if (!prismaComment) return Err(new NotFoundFailure());

		const collection = prismaCollectionToEntity(
			prismaComment.item.collection,
			prismaComment.item.collection.topic,
			prismaUserToEntity(prismaComment.item.collection.owner),
		);

		const comment: Comment = prismaCommentToEntity(
			prismaComment,
			prismaItemToEntity(prismaComment.item, collection),
		);

		return Ok(comment);
	}

	async getByItem(itemId: string): Promise<Result<Comment[], Failure>> {
		const prismaComments = await this.prisma.comment.findMany({
			where: { item: { id: itemId } },
			include: {
				item: {
					include: {
						collection: {
							include: {
								owner: true,
								topic: true,
							},
						},
						tags: true,
					},
				},
				author: true,
			},
		});

		if (prismaComments.length === 0) return Ok([]);

		const prismaItem = prismaComments[0].item;
		const item = prismaItemToEntity(
			prismaItem,
			prismaCollectionToEntity(
				prismaItem.collection,
				prismaItem.collection.topic,
				prismaUserToEntity(prismaItem.collection.owner),
			),
		);
		const comments: Comment[] = prismaComments.map((prismaComment) =>
			prismaCommentToEntity(prismaComment, item),
		);

		return Ok(comments);
	}

	async create(comment: Comment): Promise<Result<None, Failure>> {
		await this.prisma.comment.create({
			data: {
				id: comment.id,
				itemId: comment.item.id,
				userId: comment.author.id,
				text: comment.text,
				createdAt: comment.createdAt,
			},
		});

		return Ok(None);
	}

	async update(comment: Comment): Promise<Result<None, Failure>> {
		await this.prisma.comment.update({
			where: { id: comment.id },
			data: {
				text: comment.text,
			},
		});

		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		await this.prisma.comment.delete({ where: { id } });

		return Ok(None);
	}

	async deleteByItem(itemId: string): Promise<Result<None, Failure>> {
		await this.prisma.comment.deleteMany({ where: { itemId } });

		return Ok(None);
	}
}

export function prismaCommentToEntity(
	model: PrismaComment & { author: PrismaUser },
	item: Item,
): Comment {
	return {
		item,
		author: prismaUserToEntity(model.author),
		id: model.id,
		text: model.text,
		createdAt: model.createdAt,
	};
}
