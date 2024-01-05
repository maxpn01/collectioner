import { beforeEach, describe, it, expect } from "vitest";
import {
	Item,
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
import { MemoryUserRepository, User } from "../../user";
import { Comment, MemoryCommentRepository } from "./comments";
import { createTestComment } from "./comments/index.test";
import { ViewItemUseCase } from "./view-item";
import { createTestUser } from "../../user/index.test";
import {
	createTestCollection,
	createTestCollectionField,
	createTestTopic,
} from "../index.test";
import { createTestItem } from "./index.test";
import { text } from "stream/consumers";

describe("view item use case", () => {
	let viewItem: ViewItemUseCase;

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
	let numberFieldRepository: MemoryItemFieldRepository<number>;

	let textFields: Map<string, string>;
	let textFieldRepository: MemoryItemFieldRepository<string>;

	let multilineTextFields: Map<string, string>;
	let multilineTextFieldRepository: MemoryItemFieldRepository<string>;

	let checkboxFields: Map<string, boolean>;
	let checkboxFieldRepository: MemoryItemFieldRepository<boolean>;

	let dateFields: Map<string, Date>;
	let dateFieldRepository: MemoryItemFieldRepository<Date>;

	let comments: Comment[];
	let commentRepository: MemoryCommentRepository;

	beforeEach(() => {
		users = [createTestUser("alice"), createTestUser("john")];
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

		items = [createTestItem("hungergames", collections[0])];
		itemRepository = new MemoryItemRepository(items, collectionRepository);

		numberFields = new Map();
		numberFieldRepository = new MemoryItemFieldRepository<number>(numberFields);

		textFields = new Map([["hungergames->name", "Hunger Games"]]);
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

		comments = [createTestComment("comment1", "alice", items[0])];
		commentRepository = new MemoryCommentRepository(comments, itemRepository);

		viewItem = new ViewItemUseCase(
			collectionFieldRepository,
			itemRepository,
			itemFieldRepositories,
			commentRepository,
		);
	});

	it("returns item1 from the repository", async () => {
		const itemResult = await viewItem.execute("hungergames");
		const item = itemResult.unwrap();

		expect(item.id).toBe("hungergames");
		expect(item.textFields).toEqual(textFields);
		expect(item.comments[0].id).toBe("comment1");
		expect(item.comments[0].author).toEqual(users[0]);
	});
});
