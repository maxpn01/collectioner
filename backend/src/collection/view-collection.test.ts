import { describe, expect, it, beforeEach } from "vitest";
import { CollectionRepository } from ".";
import { ItemRepository } from "./item";
import { createTestItem } from "./item/index.test";
import { createTestUser } from "../user/index.test";
import { createTestCollection, createTestTopic } from "./index.test";
import { ViewCollectionUseCase } from "./view-collection";
import { mock, instance, when, deepEqual } from "ts-mockito";
import { Ok } from "ts-results";

describe("view collection use case", () => {
	let viewCollection: ViewCollectionUseCase;

	beforeEach(() => {
		const bookTopic = createTestTopic("books");

		const john = createTestUser("john");
		const johnCollection = createTestCollection(
			"johncollection",
			john,
			bookTopic,
		);
		const johnCollectionItems = [
			createTestItem("harrypotter", johnCollection),
			createTestItem("hungergames", johnCollection),
		];

		const tyler = createTestUser("tyler");
		const tylerCollection = createTestCollection(
			"tylercollection",
			tyler,
			bookTopic,
		);
		const tylerCollectionItems = [
			createTestItem("themetamorphosisofprimeintellect", johnCollection),
			createTestItem("cppfordummies", johnCollection),
			createTestItem("perfume", johnCollection),
		];

		const MockCollectionRepo = mock<CollectionRepository>();
		when(
			MockCollectionRepo.get(
				"johncollection",
				deepEqual({ include: { items: true } }),
			),
		).thenResolve(
			Ok({
				collection: johnCollection,
				items: johnCollectionItems,
			}),
		);
		when(
			MockCollectionRepo.get(
				"tylercollection",
				deepEqual({ include: { items: true } }),
			),
		).thenResolve(
			Ok({
				collection: tylerCollection,
				items: tylerCollectionItems,
			}),
		);
		const collectionRepo = instance(MockCollectionRepo);

		const MockItemRepo = mock<ItemRepository>();
		const itemRepo = instance(MockItemRepo);

		viewCollection = new ViewCollectionUseCase(collectionRepo, itemRepo);
	});

	it("returns john's collection from the repository", async () => {
		const viewCollectionResult = await viewCollection.execute("johncollection");
		const viewedCollection = viewCollectionResult.unwrap();

		expect(viewedCollection.id).toBe("johncollection");
		expect(viewedCollection.topic.id).toBe("books");
		expect(viewedCollection.items.length).toBe(2);
		expect(viewedCollection.items[1].id).toBe("hungergames");
	});

	it("returns tyler's collection from the repository", async () => {
		const viewCollectionResult = await viewCollection.execute(
			"tylercollection",
		);
		const viewedCollection = viewCollectionResult.unwrap();

		expect(viewedCollection.id).toBe("tylercollection");
		expect(viewedCollection.topic.id).toBe("books");
		expect(viewedCollection.items.length).toBe(3);
		expect(viewedCollection.items[2].id).toBe("perfume");
	});
});
