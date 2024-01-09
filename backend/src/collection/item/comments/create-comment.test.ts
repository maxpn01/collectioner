import { beforeEach, describe, it, expect } from "vitest";
import { CreateCommentUseCase } from "./create-comment";
import { MemoryUserRepository, User } from "../../../user";
import {
	Collection,
	CollectionField,
	CollectionFieldType,
	MemoryCollectionFieldRepository,
	MemoryCollectionRepository,
	MemoryTopicRepository,
	Topic,
} from "../..";
import {
	Item,
	ItemFieldRepositories,
	MemoryItemFieldRepository,
	MemoryItemRepository,
} from "..";
import { MemoryCommentRepository } from ".";
import { createTestUser } from "../../../user/index.test";
import {
	createTestCollection,
	createTestCollectionField,
	createTestTopic,
} from "../../index.test";
import { createTestItem } from "../index.test";
import { Comment } from ".";

describe("create comment use case", () => {
	let createComment: CreateCommentUseCase;

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

		comments = [];
		commentRepository = new MemoryCommentRepository(comments, itemRepository);

		createComment = new CreateCommentUseCase(
			userRepository,
			itemRepository,
			commentRepository,
		);
	});

	it("create a comment", async () => {
		const createCommentResult = await createComment.execute(
			{
				itemId: "hungergames",
				text: "nice book bruh",
			},
			"john",
			checkRequesterIsAuthenticated,
		);
		if (createCommentResult.err) throw createCommentResult;

		const commentResult = await commentRepository.getByItem("hungergames");
		if (commentResult.err) throw commentResult;
		const comment = commentResult.val;

		expect(comment.length).toBe(1);
		expect(comment[0].author.id).toBe(users[1].id);
		expect(comment[0].text).toBe("nice book bruh");
	});
});
