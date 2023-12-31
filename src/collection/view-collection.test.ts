import { describe, expect, it, beforeEach } from "vitest";
import {
	Collection,
	MemoryCollectionRepository,
	Topic,
	MemoryTopicRepository,
} from ".";
import { Item, MemoryItemRepository } from "./item";
import { MemoryUserRepository, User } from "../user";
import { createTestItem } from "./item/index.test";
import { createTestUser } from "../user/index.test";
import { createTestCollection, createTestTopic } from "./index.test";
import { ViewCollectionUseCase } from "./view-collection";

describe("view collection use case", () => {
	let users: User[];
	let userRepository: MemoryUserRepository;

	let topics: Topic[];
	let topicRepository: MemoryTopicRepository;

	let collections: Collection[];
	let collectionRepository: MemoryCollectionRepository;

	let items: Item[];
	let itemRepository: MemoryItemRepository;

	let viewCollection: ViewCollectionUseCase;

	beforeEach(() => {
		topics = [createTestTopic("topic1"), createTestTopic("topic2")];
		topicRepository = new MemoryTopicRepository(topics);

		users = [createTestUser("user1")];
		userRepository = new MemoryUserRepository(users);

		collections = [
			createTestCollection("collection1", users[0], topics[0]),
			createTestCollection("collection2", users[0], topics[1]),
		];
		collectionRepository = new MemoryCollectionRepository(
			collections,
			userRepository,
			topicRepository,
		);

		items = [
			createTestItem("collection1item1", collections[0]),
			createTestItem("collection1item2", collections[0]),
			createTestItem("collection1item3", collections[0]),
			createTestItem("collection2item1", collections[1]),
		];
		itemRepository = new MemoryItemRepository(items, collectionRepository);

		viewCollection = new ViewCollectionUseCase(
			collectionRepository,
			itemRepository,
		);
	});

	it("returns collection 1 from the repository", async () => {
		const collectionResult = await viewCollection.execute("collection1");
		const collection = collectionResult.unwrap();

		expect(collection.id).toBe("collection1");
		expect(collection.topic.id).toBe("topic1");
		expect(collection.items.length).toBe(3);
		expect(collection.items[1].id).toBe("collection1item2");
	});

	it("returns collection 2 from the repository", async () => {
		const collectionResult = await viewCollection.execute("collection2");
		const collection = collectionResult.unwrap();

		expect(collection.id).toBe("collection2");
		expect(collection.topic.id).toBe("topic2");
		expect(collection.items.length).toBe(1);
		expect(collection.items[0].id).toBe("collection2item1");
	});
});
