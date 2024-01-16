import { Result, None, Ok } from "ts-results";
import { Failure } from "../../utils/failure";
import { MeiliSearch, TaskStatus } from "meilisearch";
import { Item, ItemField, ItemFields } from ".";
import { UnixTime, dateToUnixTime } from "../../utils/date";

export interface ItemSearchEngine {
	add(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	replace(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	delete(id: string, fields: ItemFields): Promise<Result<None, Failure>>;
}

type CollectionFieldId = string;
export type ItemDocument = {
	id: string;
	name: string;
	tags: Set<string>;
	createdAt: UnixTime;
	numberFields: Record<CollectionFieldId, number>;
	textFields: Record<CollectionFieldId, string>;
	multilineTextFields: Record<CollectionFieldId, string>;
	checkboxFields: Record<CollectionFieldId, boolean>;
	dateFields: Record<CollectionFieldId, UnixTime>;
};

export const meiliItemIndex = "item";

export class MeiliItemSearchEngine implements ItemSearchEngine {
	meilisearch: MeiliSearch;

	constructor(meilisearch: MeiliSearch) {
		this.meilisearch = meilisearch;
	}

	async add(item: Item, fields: ItemFields): Promise<Result<None, Failure>> {
		const document = itemToDocument(item, fields);
		const task = await this.meilisearch
			.index(meiliItemIndex)
			.addDocuments([document]);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to add document");

		return Ok(None);
	}

	async replace(
		item: Item,
		fields: ItemFields,
	): Promise<Result<None, Failure>> {
		// Meilisearch's addDocuments method also replaces the existing documents
		// https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents
		return this.add(item, fields);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const task = await this.meilisearch
			.index(meiliItemIndex)
			.deleteDocument(id);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to delete document");

		return Ok(None);
	}
}

export function itemToDocument(item: Item, fields: ItemFields): ItemDocument {
	const unixTimeDateFields = fields.dateFields.map((itemField) => ({
		...itemField,
		value: dateToUnixTime(itemField.value),
	}));

	return {
		id: item.id,
		name: item.name,
		tags: item.tags,
		createdAt: dateToUnixTime(item.createdAt),
		numberFields: itemFieldToDocumentField(fields.numberFields),
		textFields: itemFieldToDocumentField(fields.textFields),
		multilineTextFields: itemFieldToDocumentField(fields.multilineTextFields),
		checkboxFields: itemFieldToDocumentField(fields.checkboxFields),
		dateFields: itemFieldToDocumentField(unixTimeDateFields),
	};
}

function itemFieldToDocumentField<T>(
	itemFields: ItemField<T>[],
): Record<string, T> {
	const recordField: Record<string, T> = {};

	for (const itemField of itemFields) {
		recordField[itemField.collectionField.id] = itemField.value;
	}

	return recordField;
}
