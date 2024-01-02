import { describe, beforeEach, expect, it } from "vitest";
import {
	Item,
	ItemFieldRepository,
	ItemFieldRepositories,
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
import { createTestItem } from "./index.test";
import { DeleteItemUseCase } from "./delete-item";

describe("delete item use case", () => {
	let deleteItem: DeleteItemUseCase;

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
				"name",
				CollectionFieldType.Text,
				collections[0],
			),
		];
		collectionFieldRepository = new MemoryCollectionFieldRepository(
			collectionFields,
			collectionRepository,
		);

		items = [
			createTestItem("hungergames", collections[0]),
			createTestItem("harrypotter", collections[0]),
		];
		itemRepository = new MemoryItemRepository(items, collectionRepository);

		numberFields = new Map();
		numberFieldRepository = new MemoryItemFieldRepository<number>(numberFields);

		textFields = new Map([
			["hungergames->name", "Hunger Games"],
			["harrypotter->name", "Harry Potter"],
		]);
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

		const itemFieldRepositories: ItemFieldRepositories = {
			number: numberFieldRepository,
			text: textFieldRepository,
			multilineText: multilineTextFieldRepository,
			checkbox: checkboxFieldRepository,
			date: dateFieldRepository,
		};

		deleteItem = new DeleteItemUseCase(
			userRepository,
			collectionRepository,
			collectionFieldRepository,
			itemRepository,
			itemFieldRepositories,
		);
	});

	it("deletes the item", async () => {
		const deleteResult = await deleteItem.execute(
			"hungergames",
			"alice",
			checkRequesterIsAuthenticated,
		);
		if (deleteResult.err) throw deleteResult;

		expect(items.length).toBe(1);
		expect(items[0].id).toBe("harrypotter");
		expect(textFields.size).toBe(1);
		expect(textFields.get("hungergames->name")).toBe(undefined);
	});
});
