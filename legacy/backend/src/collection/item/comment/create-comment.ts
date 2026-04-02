import { Result, None, Ok, Err } from "ts-results";
import {
	Comment,
	CommentRepository,
	ValidateCommentTextFailure,
	validateCommentText,
	validateCommentTextHttpFailurePresenter,
} from ".";
import { Item, ItemRepository } from "..";
import { User, UserRepository } from "../../../user";
import { BadRequestFailure, Failure } from "../../../utils/failure";
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
}): Result<Comment, Failure> {
	const validateCommentTextResult = validateCommentText(text);
	if (validateCommentTextResult.err) return validateCommentTextResult;

	return Ok({
		item,
		author,
		text,
		id: generateItemId(),
		createdAt: new Date(),
	});
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
	): Promise<Result<string, Failure>> {
		const itemResult = await this.itemRepository.get(request.itemId);
		if (itemResult.err) return itemResult;
		const { item } = itemResult.val;

		const commenterResult = await this.userRepository.get(requesterId);
		if (commenterResult.err) return commenterResult;
		const { user: requester } = commenterResult.val;

		const commentResult = createNewComment({
			item,
			author: requester,
			text: request.text,
		});
		if (commentResult.err) return commentResult;
		const comment = commentResult.val;

		const createResult = await this.commentRepository.create(comment);
		if (createResult.err) return createResult;

		const addResult = await this.commentSearchEngine.add(comment);
		if (addResult.err) return addResult;

		return Ok(comment.id);
	}
}

export function jsonCreateCommentController(
	json: any,
): Result<CreateCommentRequest, BadRequestFailure> {
	const isValid =
		typeof json.itemId === "string" && typeof json.text === "string";
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		itemId: json.itemId,
		text: json.text,
	});
}

import { Request, Response } from "express";
import {
	HttpFailure,
	expressSendHttpFailure,
	httpFailurePresenter,
} from "../../../http";

export function createCommentHttpFailurePresenter(
	failure: Failure,
): HttpFailure {
	if (failure instanceof ValidateCommentTextFailure) {
		return validateCommentTextHttpFailurePresenter(failure);
	}

	return httpFailurePresenter(failure);
}

export class ExpressCreateComment {
	createComment: CreateCommentUseCase;

	constructor(createComment: CreateCommentUseCase) {
		this.execute = this.execute.bind(this);
		this.createComment = createComment;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = jsonCreateCommentController(req.body);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		//@ts-ignore
		const requesterId = req.session.userId;
		const createResult = await this.createComment.execute(request, requesterId);
		if (createResult.err) {
			const failure = createResult.val;
			const httpFailure = createCommentHttpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const id = createResult.val;

		res.status(200).json({ id });
	}
}
