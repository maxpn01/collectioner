import { describe, beforeEach, it, expect } from "vitest";
import { Item, ItemFields, ItemRepository } from ".";
import { CollectionField, CollectionFieldType } from "..";
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
	anything,
} from "ts-mockito";
import { None, Ok } from "ts-results";
import { CollectionRepository } from "../repositories/collection";
import { NotAuthorizedFailure } from "../../utils/failure";
import { ItemSearchEngine } from "./search-engine";

describe("create item use case", () => {
	let createItem: CreateItemUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();
	const MockItemRepo = mock<ItemRepository>();
	const MockItemSearchEngine = mock<ItemSearchEngine>();

	const john = createTestUser("john");
	const johnCollection = createTestCollection(
		"johncollection",
		john,
		createTestTopic("books"),
	);

	const tyler = createTestUser("tyler");

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

		resetCalls(MockItemSearchEngine);
		when(MockItemSearchEngine.add(anything(), anything())).thenResolve(
			Ok(None),
		);
		const itemSearchEngine = instance(MockItemSearchEngine);

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

		createItem = new CreateItemUseCase(
			collectionRepo,
			itemRepo,
			itemSearchEngine,
			userRepo,
		);
	});

	it("creates an item", async () => {
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

	it("allow admin create items", async () => {
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

	it("doesn't allow other users create items", async () => {
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));

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
			tyler.id,
		);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockItemRepo.create(anything(), anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
