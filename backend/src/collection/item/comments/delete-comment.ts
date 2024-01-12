import { Result, None, Ok, Err } from "ts-results";
import { CommentRepository } from ".";
import { Failure } from "../../../utils/failure";
import { NotAuthorizedFailure } from "../../../user/view-user";
import { UserRepository } from "../../../user";

export class DeleteCommentUseCase {
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

		const deleteCommentResult = await this.commentRepository.delete(id);
		if (deleteCommentResult.err) return deleteCommentResult;

		return Ok(None);
	}
}
