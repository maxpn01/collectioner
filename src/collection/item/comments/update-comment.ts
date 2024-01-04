import { Result, None, Ok, Err } from "ts-results";
import { CommentRepository } from ".";
import { Failure } from "../../../utils/failure";
import { NotAuthorizedFailure } from "../../../user/view-user";

type UpdateCommentRequest = {
	id: string;
	text: string;
};

export class UpdateCommentUseCase {
	commentRepository: CommentRepository;

	constructor(commentRepository: CommentRepository) {
		this.commentRepository = commentRepository;
	}

	async execute(
		request: UpdateCommentRequest,
		commenterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const commentResult = await this.commentRepository.get(request.id);
		if (commentResult.err) return commentResult;
		const comment = commentResult.val;

		if (!checkRequesterIsAuthenticated() || commenterId !== comment.author.id)
			return Err(new NotAuthorizedFailure());

		const updatedComment = structuredClone(comment);
		updatedComment.text = request.text;

		const updateCommentResult = await this.commentRepository.update(
			updatedComment,
		);
		if (updateCommentResult.err) return updateCommentResult;

		return Ok(None);
	}
}
