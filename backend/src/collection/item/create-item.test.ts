import { describe, beforeEach, it } from "vitest";
import { Item, ItemFields, ItemRepository } from ".";
import { CollectionField, CollectionFieldType, CollectionRepository } from "..";
import { UserRepository } from "../../user";
import { createTestUser } from "../../user/index.test";
import { createTestTopic, createTestCollection } from "../index.test";
import { CreateItemUseCase } from "./create-item";
import {
	anyString,
	instance,
	mock,
	when,
	deepEqual,
	anyOfClass,
	verify,
	resetCalls,
} from "ts-mockito";
import { None, Ok } from "ts-results";

describe("create item use case", () => {
	let createItem: CreateItemUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();
	const MockItemRepo = mock<ItemRepository>();

	const john = createTestUser("john");
	const johnCollection = createTestCollection(
		"johncollection",
		john,
		createTestTopic("books"),
	);

	const admin = createTestUser("admin");
	admin.isAdmin = true;

	const pagesField: CollectionField = {
		id: "pages",
		name: "Pages",
		type: CollectionFieldType.Number,
		collection: johnCollection,
	};
	const authorField: CollectionField = {
		id: "author",
		name: "Author",
		type: CollectionFieldType.Text,
		collection: johnCollection,
	};
	const descriptionField: CollectionField = {
		id: "description",
		name: "Description",
		type: CollectionFieldType.MultilineText,
		collection: johnCollection,
	};
	const readField: CollectionField = {
		id: "read",
		name: "Read",
		type: CollectionFieldType.Checkbox,
		collection: johnCollection,
	};
	const publishedField: CollectionField = {
		id: "published",
		name: "Published",
		type: CollectionFieldType.Date,
		collection: johnCollection,
	};

	const expectedItem: Item = deepEqual({
		collection: johnCollection,
		id: anyString(),
		name: "The Hunger Games",
		tags: new Set(["book", "kids_book", "fantasy"]),
		createdAt: anyOfClass(Date),
	});

	const itemFields: ItemFields = deepEqual({
		numberFields: [
			{
				item: expectedItem,
				collectionField: pagesField,
				value: 374,
			},
		],
		textFields: [
			{
				item: expectedItem,
				collectionField: authorField,
				value: "Suzanne Collins",
			},
		],
		multilineTextFields: [
			{
				item: expectedItem,
				collectionField: descriptionField,
				value: `Sixteen-year-old Katniss Everdeen,
who lives alone with her mother and younger sister,
regards it as a death sentence when she steps forward to take her sister's place in the Games.
But Katniss has been close to dead before—and survival, for her, is second nature. Without really meaning to, she becomes a contender.
But if she is to win, she will have to start making choices that weight survival against humanity and life against love.`,
			},
		],
		checkboxFields: [
			{
				item: expectedItem,
				collectionField: readField,
				value: false,
			},
		],
		dateFields: [
			{
				item: expectedItem,
				collectionField: publishedField,
				value: new Date("September 14, 2008"),
			},
		],
	});

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCollectionRepo);
		const collectionRepo = instance(MockCollectionRepo);

		resetCalls(MockItemRepo);
		const itemRepo = instance(MockItemRepo);

		when(
			MockCollectionRepo.get(
				"johncollection",
				deepEqual({ include: { fields: true } }),
			),
		).thenResolve(
			Ok({
				collection: johnCollection,
				fields: [
					pagesField,
					authorField,
					descriptionField,
					readField,
					publishedField,
				],
			}),
		);

		createItem = new CreateItemUseCase(collectionRepo, itemRepo, userRepo);
	});

	it("creates the item", async () => {
		const createStub = MockItemRepo.create(expectedItem, itemFields);

		when(createStub).thenResolve(Ok(None));

		const result = await createItem.execute(
			{
				collectionId: "johncollection",
				name: "The Hunger Games",
				tags: new Set(["book", "kids_book", "fantasy"]),
				numberFields: new Map([["pages", 374]]),
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
				checkboxFields: new Map([["read", false]]),
				dateFields: new Map([["published", new Date("September 14, 2008")]]),
			},
			john.id,
		);
		if (result.err) throw result;

		verify(createStub).once();
	});

	it("allow admin creates items", async () => {
		const createStub = MockItemRepo.create(expectedItem, itemFields);

		when(MockUserRepo.get(admin.id)).thenResolve(Ok({ user: admin }));
		when(createStub).thenResolve(Ok(None));

		const result = await createItem.execute(
			{
				collectionId: "johncollection",
				name: "The Hunger Games",
				tags: new Set(["book", "kids_book", "fantasy"]),
				numberFields: new Map([["pages", 374]]),
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
				checkboxFields: new Map([["read", false]]),
				dateFields: new Map([["published", new Date("September 14, 2008")]]),
			},
			admin.id,
		);
		if (result.err) throw result;

		verify(createStub).once();
	});
});
