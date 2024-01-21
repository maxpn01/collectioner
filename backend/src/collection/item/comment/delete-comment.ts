import { Result, None, Ok, Err } from "ts-results";
import { CommentRepository } from ".";
import { Failure, NotAuthorizedFailure } from "../../../utils/failure";
import { UserRepository } from "../../../user";
import { CommentSearchEngine } from "./search-engine";

export class DeleteCommentUseCase {
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
		id: string,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const commentResult = await this.commentRepository.get(id);
		if (commentResult.err) return commentResult;
		const comment = commentResult.val;

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const { user: requester } = requesterResult.val;

		const canRemoveComment =
			requester.isAdmin ||
			requester.id === comment.author.id ||
			requester.id === comment.item.collection.owner.id;
		if (!canRemoveComment) return Err(new NotAuthorizedFailure());

		const deleteResult = await this.commentRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		const deleteDocumentResult = await this.commentSearchEngine.delete(id);
		if (deleteDocumentResult.err) return deleteDocumentResult;

		return Ok(None);
	}
}

import { idController } from "../../../utils/id";
import { Request, Response } from "express";
import { expressSendHttpFailure, httpFailurePresenter } from "../../../http";

export class ExpressDeleteComment {
	deleteComment: DeleteCommentUseCase;

	constructor(deleteComment: DeleteCommentUseCase) {
		this.execute = this.execute.bind(this);
		this.deleteComment = deleteComment;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = idController(req.body.id);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const id = controllerResult.val;

		//@ts-ignore
		const requesterId = req.session.userId;

		const deleteResult = await this.deleteComment.execute(id, requesterId);
		if (deleteResult.err) {
			const failure = deleteResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
