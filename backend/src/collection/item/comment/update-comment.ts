import { Result, None, Ok, Err } from "ts-results";
import { CommentRepository } from ".";
import {
	BadRequestFailure,
	Failure,
	NotAuthorizedFailure,
} from "../../../utils/failure";
import { UserRepository } from "../../../user";
import { CommentSearchEngine } from "./search-engine";

type UpdateCommentRequest = {
	id: string;
	text: string;
};

export class UpdateCommentUseCase {
	userRepository: UserRepository;
	commentRepository: CommentRepository;
	commentSearchEngine: CommentSearchEngine;

	constructor(
		userRepository: UserRepository,
		commentRepository: CommentRepository,
		commentSearchEngine: CommentSearchEngine,
	) {
		this.userRepository = userRepository;
		this.commentRepository = commentRepository;
		this.commentSearchEngine = commentSearchEngine;
	}

	async execute(
		request: UpdateCommentRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const commentResult = await this.commentRepository.get(request.id);
		if (commentResult.err) return commentResult;
		const comment = commentResult.val;

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const { user: requester } = requesterResult.val;

		const canUpdateComment = requester.id === comment.author.id;
		if (!canUpdateComment) return Err(new NotAuthorizedFailure());

		const updatedComment = structuredClone(comment);
		updatedComment.text = request.text;

		const updateResult = await this.commentRepository.update(updatedComment);
		if (updateResult.err) return updateResult;

		const replaceResult = await this.commentSearchEngine.replace(
			updatedComment,
		);
		if (replaceResult.err) return replaceResult;

		return Ok(None);
	}
}

export function jsonUpdateCommentController(
	json: any,
): Result<UpdateCommentRequest, BadRequestFailure> {
	const isValid = typeof json.id === "string" && typeof json.text === "string";
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		id: json.id,
		text: json.text,
	});
}

import { Request, Response } from "express";
import { expressSendHttpFailure, httpFailurePresenter } from "../../../http";

export class ExpressUpdateComment {
	updateComment: UpdateCommentUseCase;

	constructor(updateComment: UpdateCommentUseCase) {
		this.execute = this.execute.bind(this);
		this.updateComment = updateComment;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = jsonUpdateCommentController(req.body);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		//@ts-ignore
		const requesterId = req.session.userId;
		const updateResult = await this.updateComment.execute(request, requesterId);
		if (updateResult.err) {
			const failure = updateResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
