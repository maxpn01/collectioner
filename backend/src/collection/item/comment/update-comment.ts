import { Result, None, Ok, Err } from "ts-results";
import { CommentRepository } from ".";
import { Failure } from "../../../utils/failure";
import { NotAuthorizedFailure } from "../../../user/view-user";
import { UserRepository } from "../../../user";

type UpdateCommentRequest = {
	id: string;
	text: string;
};

export class UpdateCommentUseCase {
	userRepository: UserRepository;
	commentRepository: CommentRepository;

	constructor(
		userRepository: UserRepository,
		commentRepository: CommentRepository,
	) {
		this.userRepository = userRepository;
		this.commentRepository = commentRepository;
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

		const updateCommentResult = await this.commentRepository.update(
			updatedComment,
		);
		if (updateCommentResult.err) return updateCommentResult;

		return Ok(None);
	}
}
