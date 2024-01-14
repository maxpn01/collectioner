import { describe, beforeEach, it, expect } from "vitest";
import { ItemRepository } from ".";
import { createTestUser } from "../../user/index.test";
import { createTestTopic, createTestCollection } from "../index.test";
import { DeleteItemUseCase } from "./delete-item";
import { UserRepository } from "../../user";
import { instance, mock, when, verify, resetCalls, anything } from "ts-mockito";
import { createTestItem } from "./index.test";
import { None, Ok } from "ts-results";
import { NotAuthorizedFailure } from "../../user/view-user";
import { CollectionRepository } from "../repositories/collection";

describe("delete item use case", () => {
	let deleteItem: DeleteItemUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();
	const MockItemRepo = mock<ItemRepository>();

	const john = createTestUser("john");
	const johnCollection = createTestCollection(
		"johncollection",
		john,
		createTestTopic("books"),
	);
	const johnItem = createTestItem("johnitem", johnCollection);

	const tyler = createTestUser("tyler");
	const admin = createTestUser("admin");
	admin.isAdmin = true;

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCollectionRepo);
		const collectionRepo = instance(MockCollectionRepo);

		resetCalls(MockItemRepo);
		const itemRepo = instance(MockItemRepo);

		when(MockItemRepo.get(johnItem.id)).thenResolve(Ok({ item: johnItem }));

		deleteItem = new DeleteItemUseCase(userRepo, itemRepo, collectionRepo);
	});

	it("deletes the item", async () => {
		const deleteStub = MockItemRepo.delete(johnItem.id);

		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteItem.execute(johnItem.id, john.id);
		if (result.err) throw result;

		verify(deleteStub).once();
	});

	it("allow admins delete items", async () => {
		const deleteStub = MockItemRepo.delete(johnItem.id);

		when(MockUserRepo.get(admin.id)).thenResolve(Ok({ user: admin }));
		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteItem.execute(johnItem.id, admin.id);
		if (result.err) throw result;

		verify(deleteStub).once();
	});

	it("doesn't allow other users delete items", async () => {
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));

		const result = await deleteItem.execute(johnItem.id, tyler.id);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockItemRepo.delete(anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
