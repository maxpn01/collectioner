import env from "@/env";
import { Failure } from "@/utils/failure";
import { createContext } from "react";
import { Err, Ok, Result } from "ts-results";
import { Comment } from "../item/view-item";
import {
	AuthenticatedUserRepository,
	localStorageAuthenticatedUserRepository,
} from "@/user/auth";

type CreateCommentServiceRequest = {
	itemId: string;
	text: string;
};
type CreateCommentService = (
	req: CreateCommentServiceRequest,
) => Promise<Result<NewCommentId, Failure>>;

type NewCommentId = string;
type CreateCommentRequest = {
	itemId: string;
	text: string;
};

class CreateCommentUseCase {
	createComment: CreateCommentService;
	repo: AuthenticatedUserRepository;

	constructor(
		createComment: CreateCommentService,
		repo: AuthenticatedUserRepository,
	) {
		this.execute = this.execute.bind(this);
		this.createComment = createComment;
		this.repo = repo;
	}

	async execute(req: CreateCommentRequest): Promise<Result<Comment, Failure>> {
		const result = await this.createComment(req);
		if (result.err) return result;
		const id = result.val;

		const authenticatedUser = this.repo.get().unwrap();

		return Ok({
			id,
			author: {
				id: authenticatedUser.id,
				username: authenticatedUser.username,
				blocked: false,
			},
			text: req.text,
			createdAt: new Date(),
		});
	}
}

const httpCreateCommentService: CreateCommentService = async (
	req: CreateCommentRequest,
): Promise<Result<NewCommentId, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/comment`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(req),
		credentials: "include",
	});
	if (!res.ok) {
		return Err(new Failure());
	}
	const json = await res.json();

	return Ok(json.id);
};

export const CreateCommentUseCaseContext = createContext(
	new CreateCommentUseCase(
		env.isProduction ? httpCreateCommentService : httpCreateCommentService,
		localStorageAuthenticatedUserRepository,
	),
);
