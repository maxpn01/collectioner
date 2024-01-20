import { beforeEach, describe, it, expect } from "vitest";
import { UserRepository } from "../../../user";
import { CommentRepository } from ".";
import { createTestUser } from "../../../user/index.test";
import { createTestCollection, createTestTopic } from "../../index.test";
import { createTestItem } from "../index.test";
import { createTestComment } from "./index.test";
import { UpdateCommentUseCase } from "./update-comment";
import {
	anything,
	deepEqual,
	instance,
	mock,
	resetCalls,
	verify,
	when,
} from "ts-mockito";
import { None, Ok } from "ts-results";
import { CommentSearchEngine } from "./search-engine";
import { NotAuthorizedFailure } from "../../../utils/failure";

describe("update comment use case", () => {
	let updateComment: UpdateCommentUseCase;

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

	const updateCommentRequest = {
		id: tylerComment.id,
		text: "nice book",
	};

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCommentRepo);
		const commentRepo = instance(MockCommentRepo);

		resetCalls(MockCommentSearchEngine);
		when(MockCommentSearchEngine.replace(anything())).thenResolve(Ok(None));
		const commentSearchEngine = instance(MockCommentSearchEngine);

		updateComment = new UpdateCommentUseCase(
			userRepo,
			commentRepo,
			commentSearchEngine,
		);
	});

	it("update a comment", async () => {
		const updatedComment = structuredClone(tylerComment);
		updatedComment.text = updateCommentRequest.text;

		const updateStub = MockCommentRepo.update(deepEqual(updatedComment));

		when(MockCommentRepo.get(tylerComment.id)).thenResolve(Ok(tylerComment));
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));
		when(updateStub).thenResolve(Ok(None));

		const result = await updateComment.execute(updateCommentRequest, tyler.id);
		if (result.err) throw result;

		verify(updateStub).once();
	});

	it("doesn't allow other users update comments", async () => {
		when(MockCommentRepo.get(tylerComment.id)).thenResolve(Ok(tylerComment));
		when(MockUserRepo.get(alice.id)).thenResolve(Ok({ user: alice }));

		const result = await updateComment.execute(updateCommentRequest, alice.id);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockCommentRepo.update(anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
