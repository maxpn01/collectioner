import { Result, None, Err, Ok } from "ts-results";
import { Item, prismaItemToEntity } from "..";
import { PrismaUser, User, prismaUserToEntity } from "../../../user";
import { Failure, NotFoundFailure } from "../../../utils/failure";
import { PrismaClient, Comment as PrismaComment } from "@prisma/client";
import { prismaCollectionToEntity } from "../..";

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

		const collection = prismaCollectionToEntity(prismaComment.item.collection);

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

		const item =
			prismaComments.length > 0
				? prismaItemToEntity(
						prismaComments[0].item,
						prismaCollectionToEntity(prismaComments[0].item.collection),
				  )
				: null;
		const comments: Comment[] = prismaComments.map((prismaComment) =>
			prismaCommentToEntity(prismaComment, item!),
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
