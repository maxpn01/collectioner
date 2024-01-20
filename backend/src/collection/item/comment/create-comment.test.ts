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
	resetCalls,
	verify,
	when,
} from "ts-mockito";
import { None, Ok } from "ts-results";
import { CommentSearchEngine } from "./search-engine";

describe("create comment use case", () => {
	let createComment: CreateCommentUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockItemRepo = mock<ItemRepository>();
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

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockItemRepo);
		const itemRepo = instance(MockItemRepo);

		resetCalls(MockCommentRepo);
		const commentRepo = instance(MockCommentRepo);

		resetCalls(MockCommentSearchEngine);
		when(MockCommentSearchEngine.add(anything())).thenResolve(Ok(None));
		const commentSearchEngine = instance(MockCommentSearchEngine);

		createComment = new CreateCommentUseCase(
			userRepo,
			itemRepo,
			commentRepo,
			commentSearchEngine,
		);
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
