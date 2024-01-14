import { describe, beforeEach, it, expect } from "vitest";
import { Item, ItemFields, ItemRepository } from ".";
import { CollectionField, CollectionFieldType } from "..";
import { UserRepository } from "../../user";
import { createTestUser } from "../../user/index.test";
import { createTestTopic, createTestCollection } from "../index.test";
import { UpdateItemUseCase } from "./update-item";
import { instance, mock, when, verify, resetCalls, anything } from "ts-mockito";
import { createTestItem } from "./index.test";
import { None, Ok } from "ts-results";
import { betterDeepEqual } from "../../utils/ts-mockito";
import { NotAuthorizedFailure } from "../../user/view-user";
import { CollectionRepository } from "../repositories/collection";
import { CollectionFieldRepository } from "../repositories/collection-field";

describe("update item use case", () => {
	let updateItem: UpdateItemUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();
	const MockCollectionFieldRepo = mock<CollectionFieldRepository>();
	const MockItemRepo = mock<ItemRepository>();

	const john = createTestUser("john");
	const johnCollection = createTestCollection(
		"johncollection",
		john,
		createTestTopic("books"),
	);
	const johnItem = createTestItem("johnitem", johnCollection);

	const tyler = createTestUser("tyler");
	const admin = createTestUser("admin");
	admin.isAdmin = true;

	const pagesCollectionField = {
		id: "pages",
		name: "Pages",
		type: CollectionFieldType.Number,
		collection: johnCollection,
	};
	const authorCollectionField = {
		id: "author",
		name: "Author",
		type: CollectionFieldType.Text,
		collection: johnCollection,
	};
	const descriptionCollectionField = {
		id: "description",
		name: "Description",
		type: CollectionFieldType.MultilineText,
		collection: johnCollection,
	};
	const readCollectionField = {
		id: "read",
		name: "Read",
		type: CollectionFieldType.Checkbox,
		collection: johnCollection,
	};
	const publishedCollectionField = {
		id: "published",
		name: "Published",
		type: CollectionFieldType.Date,
		collection: johnCollection,
	};

	const collectionFields: CollectionField[] = [
		pagesCollectionField,
		authorCollectionField,
		descriptionCollectionField,
		readCollectionField,
		publishedCollectionField,
	];

	const updatedItem: Item = {
		collection: johnCollection,
		id: johnItem.id,
		name: "Harry Potter and the Sorcerer's Stone",
		tags: new Set(["book", "fiction", "fantasy"]),
		createdAt: johnItem.createdAt,
	};

	const updatedItemFields: ItemFields = {
		numberFields: [
			{
				item: updatedItem,
				collectionField: pagesCollectionField,
				value: 333,
			},
		],
		textFields: [
			{
				item: updatedItem,
				collectionField: authorCollectionField,
				value: "JK Rowling",
			},
		],
		multilineTextFields: [
			{
				item: updatedItem,
				collectionField: descriptionCollectionField,
				value: `Turning the envelope over, his hand trembling, Harry saw a purple wax seal bearing a coat of arms; a lion, an eagle, a badger and a snake surrounding a large letter 'H'.`,
			},
		],
		checkboxFields: [
			{
				item: updatedItem,
				collectionField: readCollectionField,
				value: true,
			},
		],
		dateFields: [
			{
				item: updatedItem,
				collectionField: publishedCollectionField,
				value: new Date("June 26, 1997"),
			},
		],
	};

	const updatedItemRequest = {
		id: updatedItem.id,
		name: updatedItem.name,
		tags: updatedItem.tags,
		numberFields: new Map([["pages", updatedItemFields.numberFields[0].value]]),
		textFields: new Map([["author", updatedItemFields.textFields[0].value]]),
		multilineTextFields: new Map([
			["description", updatedItemFields.multilineTextFields[0].value],
		]),
		checkboxFields: new Map([
			["read", updatedItemFields.checkboxFields[0].value],
		]),
		dateFields: new Map([["published", updatedItemFields.dateFields[0].value]]),
	};

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCollectionRepo);
		const collectionRepo = instance(MockCollectionRepo);

		resetCalls(MockCollectionFieldRepo);
		const collectionFieldRepo = instance(MockCollectionFieldRepo);

		resetCalls(MockItemRepo);
		const itemRepo = instance(MockItemRepo);

		when(MockItemRepo.get(johnItem.id)).thenResolve(Ok({ item: johnItem }));
		when(
			MockCollectionFieldRepo.getByCollection(johnCollection.id),
		).thenResolve(Ok(collectionFields));

		updateItem = new UpdateItemUseCase(
			userRepo,
			collectionFieldRepo,
			itemRepo,
			collectionRepo,
		);
	});

	it("updates the item", async () => {
		const updateStub = MockItemRepo.update(
			betterDeepEqual(updatedItem),
			betterDeepEqual(updatedItemFields),
		);

		when(updateStub).thenResolve(Ok(None));

		const result = await updateItem.execute(updatedItemRequest, john.id);
		if (result.err) throw result;

		verify(updateStub).once();
	});

	it("allow admin update items", async () => {
		const updateStub = MockItemRepo.update(
			betterDeepEqual(updatedItem),
			betterDeepEqual(updatedItemFields),
		);

		when(MockUserRepo.get(admin.id)).thenResolve(Ok({ user: admin }));
		when(updateStub).thenResolve(Ok(None));

		const result = await updateItem.execute(updatedItemRequest, admin.id);
		if (result.err) throw result;

		verify(updateStub).once();
	});

	it("doesn't allow other users update items", async () => {
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));

		const result = await updateItem.execute(updatedItemRequest, tyler.id);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockItemRepo.update(anything(), anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
