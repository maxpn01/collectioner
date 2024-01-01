import { describe, beforeEach, expect, it } from "vitest";
import { Item, MemoryItemRepository } from ".";
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
import { AuthorizeCollectionUpdateUseCase } from "../update-collection";
import { MemoryKeyValueRepository } from "../../utils/key-value";
import { UpdateItemUseCase } from "./update-item";

describe("update item use case", () => {
	let updateItem: UpdateItemUseCase;
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
	let numberFieldRepository: MemoryKeyValueRepository<number>;

	let textFields: Map<string, string>;
	let textFieldRepository: MemoryKeyValueRepository<string>;

	let multilineTextFields: Map<string, string>;
	let multilineTextFieldRepository: MemoryKeyValueRepository<string>;

	let checkboxFields: Map<string, boolean>;
	let checkboxFieldRepository: MemoryKeyValueRepository<boolean>;

	let dateFields: Map<string, Date>;
	let dateFieldRepository: MemoryKeyValueRepository<Date>;

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
		numberFieldRepository = new MemoryKeyValueRepository<number>(numberFields);

		textFields = new Map();
		textFieldRepository = new MemoryKeyValueRepository<string>(textFields);

		multilineTextFields = new Map();
		multilineTextFieldRepository = new MemoryKeyValueRepository<string>(
			multilineTextFields,
		);

		checkboxFields = new Map();
		checkboxFieldRepository = new MemoryKeyValueRepository<boolean>(
			checkboxFields,
		);

		dateFields = new Map();
		dateFieldRepository = new MemoryKeyValueRepository<Date>(dateFields);

		const itemFieldRepositories = {
			number: numberFieldRepository,
			text: textFieldRepository,
			multilineText: multilineTextFieldRepository,
			checkbox: checkboxFieldRepository,
			date: dateFieldRepository,
		};

		createItem = new CreateItemUseCase(
			userRepository,
			collectionRepository,
			collectionFieldRepository,
			itemRepository,
			itemFieldRepositories,
		);
		viewCollection = new ViewCollectionUseCase(
			collectionRepository,
			itemRepository,
		);
		updateItem = new UpdateItemUseCase(
			userRepository,
			collectionRepository,
			collectionFieldRepository,
			itemRepository,
			itemFieldRepositories,
		);
	});

	it("updates the item", async () => {
		const createItemResult = await createItem.execute(
			{
				collectionId: "top50fantasy",
				name: "The Hunger Games",
				tags: ["book", "kids_book", "fantasy"],
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
		if (createItemResult.err) throw createItemResult;
		const itemId = createItemResult.val;

		const updateItemResult = await updateItem.execute(
			{
				id: itemId,
				name: "Do Androids Dream of Electric Sheep?",
				tags: ["book", "science-fiction", "fantasy", "cyberpunk"],
				textFields: new Map([["author", "Philip K. Dick"]]),
				multilineTextFields: new Map([
					[
						"description",
						`It was January 2021, and Rick Deckard had a license to kill. 
Somewhere among the hordes of humans out there, lurked several rogue androids. 
Deckard's assignment--find them and then..."retire" them. 
Trouble was, the androids all looked exactly like humans, and they didn't want to be found!`,
					],
				]),
				numberFields: new Map([["pages", 258]]),
				checkboxFields: new Map([["read", true]]),
				dateFields: new Map([["published", new Date("January 1, 1968")]]),
			},
			"alice",
			checkRequesterIsAuthenticated,
		);
		if (updateItemResult.err) throw updateItemResult;

		const collectionResult = await viewCollection.execute("top50fantasy");
		const collection = collectionResult.unwrap();

		expect(collection.items.length).toBe(1);
		expect(collection.items[0].name).toBe(
			"Do Androids Dream of Electric Sheep?",
		);
	});
});
