import { beforeEach, describe, it } from "vitest";
import { CreateCommentUseCase } from "./create-comment";
import { UserRepository } from "../../../user";
import { ItemRepository } from "..";
import { Comment, CommentRepository } from ".";
import { createTestUser } from "../../../user/index.test";
import { createTestCollection, createTestTopic } from "../../index.test";
import { createTestItem } from "../index.test";
import {
	anyString,
	anything,
	deepEqual,
	instance,
	mock,
	verify,
	when,
} from "ts-mockito";
import { None, Ok } from "ts-results";

describe("create comment use case", () => {
	let createComment: CreateCommentUseCase;

	const MockUserRepo = mock<UserRepository>();
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

	beforeEach(() => {
		const userRepo = instance(MockUserRepo);
		const itemRepo = instance(MockItemRepo);
		const commentRepo = instance(MockCommentRepo);

		createComment = new CreateCommentUseCase(userRepo, itemRepo, commentRepo);
	});

	it("create a comment", async () => {
		const tylerComment: Comment = {
			item: johnItem,
			id: anyString(),
			author: tyler,
			text: "i love it!",
			createdAt: anything(),
		};
		const commentRequest = {
			itemId: johnItem.id,
			text: tylerComment.text,
		};

		const createStub = MockCommentRepo.create(deepEqual(tylerComment));

		when(MockItemRepo.get(johnItem.id)).thenResolve(Ok({ item: johnItem }));
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));
		when(createStub).thenResolve(Ok(None));

		const result = await createComment.execute(commentRequest, tyler.id);
		if (result.err) throw result;

		verify(createStub).once();
	});
});
