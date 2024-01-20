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
