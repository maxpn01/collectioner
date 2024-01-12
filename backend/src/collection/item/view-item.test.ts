import { beforeEach, describe, it, expect } from "vitest";
import { ItemFields, ItemRepository } from ".";
import { CollectionField, CollectionFieldType } from "..";
import { createTestComment } from "./comments/index.test";
import { ViewItemUseCase } from "./view-item";
import { createTestUser } from "../../user/index.test";
import { createTestCollection, createTestTopic } from "../index.test";
import { createTestItem } from "./index.test";
import { instance, mock, when, deepEqual } from "ts-mockito";
import { Ok } from "ts-results";

describe("view item use case", () => {
	let viewItem: ViewItemUseCase;

	const MockItemRepo = mock<ItemRepository>();

	const john = createTestUser("john");
	const johnCollection = createTestCollection(
		"johncollection",
		john,
		createTestTopic("books"),
	);
	const johnItem = createTestItem("johnitem", johnCollection);
	johnItem.name = "Harry Potter";
	const johnComment = createTestComment("johncomment", john.id, johnItem);
	johnComment.text = "I love it!";

	beforeEach(() => {
		const itemRepo = instance(MockItemRepo);

		viewItem = new ViewItemUseCase(itemRepo);
	});

	it("returns item from the repository", async () => {
		const collectionFields: CollectionField[] = [
			{
				id: "pages",
				name: "Pages",
				type: CollectionFieldType.Number,
				collection: johnCollection,
			},
			{
				id: "author",
				name: "Author",
				type: CollectionFieldType.Text,
				collection: johnCollection,
			},
			{
				id: "description",
				name: "Description",
				type: CollectionFieldType.MultilineText,
				collection: johnCollection,
			},
			{
				id: "read",
				name: "Read",
				type: CollectionFieldType.Checkbox,
				collection: johnCollection,
			},
			{
				id: "published",
				name: "Published",
				type: CollectionFieldType.Date,
				collection: johnCollection,
			},
		];

		const itemFields: ItemFields = {
			numberFields: [
				{
					item: johnItem,
					collectionField: collectionFields[0],
					value: 333,
				},
			],
			textFields: [
				{
					item: johnItem,
					collectionField: collectionFields[1],
					value: "JK Rowling",
				},
			],
			multilineTextFields: [
				{
					item: johnItem,
					collectionField: collectionFields[2],
					value: `Turning the envelope over, his hand trembling, Harry saw a purple wax seal bearing a coat of arms; a lion, an eagle, a badger and a snake surrounding a large letter 'H'.`,
				},
			],
			checkboxFields: [
				{
					item: johnItem,
					collectionField: collectionFields[3],
					value: true,
				},
			],
			dateFields: [
				{
					item: johnItem,
					collectionField: collectionFields[4],
					value: new Date("June 26, 1997"),
				},
			],
		};

		when(
			MockItemRepo.get(
				johnItem.id,
				deepEqual({ include: { fields: true, comments: true } }),
			),
		).thenResolve(
			Ok({
				item: johnItem,
				fields: itemFields,
				comments: [johnComment],
			}),
		);

		const viewItemResult = await viewItem.execute(johnItem.id);
		const viewedItem = viewItemResult.unwrap();

		expect(viewedItem.id).toBe(johnItem.id);
		expect(viewedItem.name).toBe("Harry Potter");
		expect(viewedItem.fields.textFields.size).toBe(1);
		expect(viewedItem.comments[0].text).toBe(johnComment.text);
	});
});
