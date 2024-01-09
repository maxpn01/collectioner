import { describe, beforeEach, expect, it } from "vitest";
import {
	Item,
	ItemFieldRepository,
	MemoryItemFieldRepository,
	MemoryItemRepository,
} from ".";
import {
	Collection,
	CollectionField,
	CollectionFieldType,
	MemoryCollectionFieldRepository,
	MemoryCollectionRepository,
	MemoryTopicRepository,
	Topic,
} from "..";
import { User, MemoryUserRepository } from "../../user";
import { createTestUser } from "../../user/index.test";
import {
	createTestTopic,
	createTestCollection,
	createTestCollectionField,
} from "../index.test";
import { CreateItemUseCase } from "./create-item";
import { ViewCollectionUseCase } from "../view-collection";

describe("create item use case", () => {
	let createItem: CreateItemUseCase;
	let viewCollection: ViewCollectionUseCase;

	let checkRequesterIsAuthenticated: () => boolean;

	let users: User[];
	let userRepository: MemoryUserRepository;

	let topics: Topic[];
	let topicRepository: MemoryTopicRepository;

	let collections: Collection[];
	let collectionRepository: MemoryCollectionRepository;

	let collectionFields: CollectionField[];
	let collectionFieldRepository: MemoryCollectionFieldRepository;

	let items: Item[];
	let itemRepository: MemoryItemRepository;

	let numberFields: Map<string, number>;
	let numberFieldRepository: ItemFieldRepository<number>;

	let textFields: Map<string, string>;
	let textFieldRepository: ItemFieldRepository<string>;

	let multilineTextFields: Map<string, string>;
	let multilineTextFieldRepository: ItemFieldRepository<string>;

	let checkboxFields: Map<string, boolean>;
	let checkboxFieldRepository: ItemFieldRepository<boolean>;

	let dateFields: Map<string, Date>;
	let dateFieldRepository: ItemFieldRepository<Date>;

	beforeEach(() => {
		checkRequesterIsAuthenticated = () => true;

		const admin = createTestUser("tyler admin");
		admin.isAdmin = true;
		users = [createTestUser("alice"), createTestUser("john"), admin];
		userRepository = new MemoryUserRepository(users);

		topics = [createTestTopic("book")];
		topicRepository = new MemoryTopicRepository(topics);

		collections = [createTestCollection("top50fantasy", users[0], topics[0])];
		collectionRepository = new MemoryCollectionRepository(
			collections,
			userRepository,
			topicRepository,
		);

		collectionFields = [
			createTestCollectionField(
				"author",
				CollectionFieldType.Text,
				collections[0],
			),
			createTestCollectionField(
				"description",
				CollectionFieldType.MultilineText,
				collections[0],
			),
			createTestCollectionField(
				"pages",
				CollectionFieldType.Number,
				collections[0],
			),
			createTestCollectionField(
				"read",
				CollectionFieldType.Checkbox,
				collections[0],
			),
			createTestCollectionField(
				"published",
				CollectionFieldType.Date,
				collections[0],
			),
		];
		collectionFieldRepository = new MemoryCollectionFieldRepository(
			collectionFields,
			collectionRepository,
		);

		items = [];
		itemRepository = new MemoryItemRepository(items, collectionRepository);

		numberFields = new Map();
		numberFieldRepository = new MemoryItemFieldRepository<number>(numberFields);

		textFields = new Map();
		textFieldRepository = new MemoryItemFieldRepository<string>(textFields);

		multilineTextFields = new Map();
		multilineTextFieldRepository = new MemoryItemFieldRepository<string>(
			multilineTextFields,
		);

		checkboxFields = new Map();
		checkboxFieldRepository = new MemoryItemFieldRepository<boolean>(
			checkboxFields,
		);

		dateFields = new Map();
		dateFieldRepository = new MemoryItemFieldRepository<Date>(dateFields);

		createItem = new CreateItemUseCase(
			userRepository,
			collectionRepository,
			collectionFieldRepository,
			itemRepository,
			{
				number: numberFieldRepository,
				text: textFieldRepository,
				multilineText: multilineTextFieldRepository,
				checkbox: checkboxFieldRepository,
				date: dateFieldRepository,
			},
		);
		viewCollection = new ViewCollectionUseCase(
			collectionRepository,
			itemRepository,
		);
	});

	it("creates the item", async () => {
		const result = await createItem.execute(
			{
				collectionId: "top50fantasy",
				name: "The Hunger Games",
				tags: new Set(["book", "kids_book", "fantasy"]),
				textFields: new Map([["author", "Suzanne Collins"]]),
				multilineTextFields: new Map([
					[
						"description",
						`Sixteen-year-old Katniss Everdeen,
who lives alone with her mother and younger sister,
regards it as a death sentence when she steps forward to take her sister's place in the Games.
But Katniss has been close to dead before—and survival, for her, is second nature. Without really meaning to, she becomes a contender.
But if she is to win, she will have to start making choices that weight survival against humanity and life against love.`,
					],
				]),
				numberFields: new Map([["pages", 374]]),
				checkboxFields: new Map([["read", false]]),
				dateFields: new Map([["published", new Date("September 14, 2008")]]),
			},
			"alice",
			checkRequesterIsAuthenticated,
		);
		if (result.err) throw result;

		const collectionResult = await viewCollection.execute("top50fantasy");
		const collection = collectionResult.unwrap();

		expect(collection.items.length).toBe(1);
		expect(collection.items[0].name).toBe("The Hunger Games");
	});
});
