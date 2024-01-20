import { Result, None, Ok, Err } from "ts-results";
import { CommentRepository } from ".";
import { Failure, NotAuthorizedFailure } from "../../../utils/failure";
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
