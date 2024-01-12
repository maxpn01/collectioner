import { describe, beforeEach, it } from "vitest";
import { ItemRepository } from ".";
import { CollectionRepository } from "..";
import { createTestUser } from "../../user/index.test";
import { createTestTopic, createTestCollection } from "../index.test";
import { DeleteItemUseCase } from "./delete-item";
import { UserRepository } from "../../user";
import { instance, mock, when, verify } from "ts-mockito";
import { createTestItem } from "./index.test";
import { None, Ok } from "ts-results";

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

	const item = createTestItem("johncollectionitem", johnCollection);

	beforeEach(() => {
		const userRepo = instance(MockUserRepo);
		const collectionRepo = instance(MockCollectionRepo);
		const itemRepo = instance(MockItemRepo);

		deleteItem = new DeleteItemUseCase(userRepo, itemRepo, collectionRepo);
	});

	it("deletes the item", async () => {
		const deleteStub = MockItemRepo.delete(item.id);

		when(MockItemRepo.get("johncollectionitem")).thenResolve(Ok({ item }));
		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteItem.execute("johncollectionitem", "john");
		if (result.err) throw result;

		verify(deleteStub).once();
	});
});
