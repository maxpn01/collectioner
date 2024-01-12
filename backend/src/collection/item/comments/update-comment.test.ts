import { beforeEach, describe, it, expect } from "vitest";
import { UserRepository } from "../../../user";
import { CollectionRepository } from "../..";
import { ItemRepository } from "..";
import { CommentRepository } from ".";
import { createTestUser } from "../../../user/index.test";
import { createTestCollection, createTestTopic } from "../../index.test";
import { createTestItem } from "../index.test";
import { createTestComment } from "./index.test";
import { UpdateCommentUseCase } from "./update-comment";
import {
	deepEqual,
	instance,
	mock,
	resetCalls,
	verify,
	when,
} from "ts-mockito";
import { Err, None, Ok } from "ts-results";
import { NotAuthorizedFailure } from "../../../user/view-user";

describe("update comment use case", () => {
	let updateComment: UpdateCommentUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();
	const MockItemRepo = mock<ItemRepository>();
	const MockCommentRepo = mock<CommentRepository>();

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

	const alice = createTestUser("tyler");

	const admin = createTestUser("tyler");
	admin.isAdmin = true;

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCommentRepo);
		const commentRepo = instance(MockCommentRepo);

		updateComment = new UpdateCommentUseCase(userRepo, commentRepo);
	});

	it("update a comment", async () => {
		const updateCommentRequest = {
			id: tylerComment.id,
			text: "nice book",
		};
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
		const updateStub = MockCommentRepo.update(tylerComment);

		when(MockCommentRepo.get(tylerComment.id)).thenResolve(Ok(tylerComment));
		when(MockUserRepo.get(alice.id)).thenResolve(
			Err(new NotAuthorizedFailure()),
		);
		when(updateStub).thenResolve(Ok(None));

		const updateCommentRequest = {
			id: tylerComment.id,
			text: "nice book",
		};

		const result = await updateComment.execute(updateCommentRequest, alice.id);
		if (result.ok)
			throw new Error(
				"This user is not allowed to update another user's comment",
			);
		const failure = result.val;

		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
