import { Result, None, Ok, Err } from "ts-results";
import { CommentRepository } from ".";
import { Failure } from "../../../utils/failure";
import { NotAuthorizedFailure } from "../../../user/view-user";

export class DeleteCommentUseCase {
	commentRepository: CommentRepository;

	constructor(commentRepository: CommentRepository) {
		this.commentRepository = commentRepository;
	}

	async execute(
		id: string,
		commenterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const commentResult = await this.commentRepository.get(id);
		if (commentResult.err) return commentResult;
		const comment = commentResult.val;

		if (!checkRequesterIsAuthenticated() || commenterId !== comment.author.id)
			return Err(new NotAuthorizedFailure());

		const deleteCommentResult = await this.commentRepository.delete(id);
		if (deleteCommentResult.err) return deleteCommentResult;

		return Ok(None);
	}
}
