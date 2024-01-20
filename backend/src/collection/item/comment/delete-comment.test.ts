import { beforeEach, describe, expect, it } from "vitest";
import { UserRepository } from "../../../user";
import { CommentRepository } from ".";
import { createTestUser } from "../../../user/index.test";
import { createTestCollection, createTestTopic } from "../../index.test";
import { createTestItem } from "../index.test";
import { createTestComment } from "./index.test";
import { DeleteCommentUseCase } from "./delete-comment";
import { instance, mock, when, verify, resetCalls, anything } from "ts-mockito";
import { None, Ok } from "ts-results";
import { CommentSearchEngine } from "./search-engine";
import { NotAuthorizedFailure } from "../../../utils/failure";

describe("delete comment use case", () => {
	let deleteComment: DeleteCommentUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCommentRepo = mock<CommentRepository>();
	const MockCommentSearchEngine = mock<CommentSearchEngine>();

	const john = createTestUser("john");
	const johnCollection = createTestCollection(
		"johncollection",
		john,
		createTestTopic("books"),
	);
	const johnItem = createTestItem("johnitem", johnCollection);

	const tyler = createTestUser("tyler");
	const tylerComment = createTestComment("tylercomment", tyler.id, johnItem);
	tylerComment.item = johnItem;
	tylerComment.text = "i love it!";

	const alice = createTestUser("alice");

	const admin = createTestUser("tyler");
	admin.isAdmin = true;

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCommentRepo);
		const commentRepo = instance(MockCommentRepo);

		resetCalls(MockCommentSearchEngine);
		when(MockCommentSearchEngine.delete(anything())).thenResolve(Ok(None));
		const commentSearchEngine = instance(MockCommentSearchEngine);

		deleteComment = new DeleteCommentUseCase(
			userRepo,
			commentRepo,
			commentSearchEngine,
		);
	});

	it("deletes a comment", async () => {
		const deleteStub = MockCommentRepo.delete(tylerComment.id);

		when(MockCommentRepo.get(tylerComment.id)).thenResolve(Ok(tylerComment));
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));
		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteComment.execute(tylerComment.id, tyler.id);
		if (result.err) throw result;

		verify(deleteStub).once();
	});

	it("allows item owner delete comments", async () => {
		const deleteStub = MockCommentRepo.delete(tylerComment.id);

		when(MockCommentRepo.get(tylerComment.id)).thenResolve(Ok(tylerComment));
		when(MockUserRepo.get(john.id)).thenResolve(Ok({ user: john }));
		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteComment.execute(tylerComment.id, john.id);
		if (result.err) throw result;

		verify(deleteStub).once();
	});

	it("allows admins delete comments", async () => {
		const deleteStub = MockCommentRepo.delete(tylerComment.id);

		when(MockCommentRepo.get(tylerComment.id)).thenResolve(Ok(tylerComment));
		when(MockUserRepo.get(admin.id)).thenResolve(Ok({ user: admin }));
		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteComment.execute(tylerComment.id, admin.id);
		if (result.err) throw result;

		verify(deleteStub).once();
	});

	it("doesn't allow other users delete comments", async () => {
		when(MockCommentRepo.get(tylerComment.id)).thenResolve(Ok(tylerComment));
		when(MockUserRepo.get(alice.id)).thenResolve(Ok({ user: alice }));

		const result = await deleteComment.execute(tylerComment.id, alice.id);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockCommentRepo.delete(anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
