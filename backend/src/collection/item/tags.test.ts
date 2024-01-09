import { describe, beforeEach, it, expect } from "vitest";
import { Item, MemoryItemRepository } from ".";
import {
	Topic,
	MemoryTopicRepository,
	Collection,
	MemoryCollectionRepository,
} from "..";
import { User, MemoryUserRepository } from "../../user";
import { createTestUser } from "../../user/index.test";
import { createTestTopic, createTestCollection } from "../index.test";
import { MemoryTagsRepository, TagsAutocompleteUseCase } from "./tags";

describe("tags autocomplete", () => {
	let tagsAutocomplete: TagsAutocompleteUseCase;

	let users: User[];
	let userRepository: MemoryUserRepository;

	let topics: Topic[];
	let topicRepository: MemoryTopicRepository;

	let collections: Collection[];
	let collectionRepository: MemoryCollectionRepository;

	let items: Item[];
	let itemRepository: MemoryItemRepository;

	let tags: Set<string>;
	let tagsRepository: MemoryTagsRepository;

	beforeEach(() => {
		users = [createTestUser("alice")];
		userRepository = new MemoryUserRepository(users);

		topics = [createTestTopic("book")];
		topicRepository = new MemoryTopicRepository(topics);

		collections = [createTestCollection("top50fantasy", users[0], topics[0])];
		collectionRepository = new MemoryCollectionRepository(
			collections,
			userRepository,
			topicRepository,
		);

		tags = new Set(["book", "fantasy", "dystopia", "young adult"]);

		items = [
			{
				collection: collections[0],
				id: "hungergames",
				name: "Hunger Games",
				tags,
				createdAt: new Date(),
			},
		];
		itemRepository = new MemoryItemRepository(items, collectionRepository);
		tagsRepository = new MemoryTagsRepository(itemRepository);

		tagsAutocomplete = new TagsAutocompleteUseCase(tagsRepository);
	});

	it("returns all tags", async () => {
		const tagsResult = await tagsAutocomplete.getAllTags();
		if (tagsResult.err) throw tagsResult;
		const tags = tagsResult.val;

		expect(tags).toEqual(items[0].tags);
	});

	it("returns all tags that start with a string", async () => {
		const filteredTagsResult = await tagsAutocomplete.getTagsThatStartWith("d");
		if (filteredTagsResult.err) throw filteredTagsResult;
		const filteredTags = filteredTagsResult.val;

		expect(filteredTags).toEqual(new Set(["dystopia"]));
	});
});
