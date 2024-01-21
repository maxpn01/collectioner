import { Result, None, Ok } from "ts-results";
import { Failure } from "../utils/failure";
import { Collection, CollectionField } from ".";
import { MeiliSearch, TaskStatus } from "meilisearch";

export interface CollectionSearchEngine {
	add(
		collection: Collection,
		fields: CollectionField[],
	): Promise<Result<None, Failure>>;
	replace(
		collection: Collection,
		fields: CollectionField[],
	): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export type CollectionDocument = {
	id: string;
	name: string;
	topic: {
		id: string;
		name: string;
	};
	fields: CollectionField[];
};

export const meiliCollectionIndex = "collection";

export class MeiliCollectionSearchEngine implements CollectionSearchEngine {
	meilisearch: MeiliSearch;

	constructor(meilisearch: MeiliSearch) {
		this.meilisearch = meilisearch;
	}

	async add(
		collection: Collection,
		fields: CollectionField[],
	): Promise<Result<None, Failure>> {
		const document = collectionToDocument(collection, fields);
		const task = await this.meilisearch
			.index(meiliCollectionIndex)
			.addDocuments([document]);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to add document");

		return Ok(None);
	}

	async replace(
		collection: Collection,
		fields: CollectionField[],
	): Promise<Result<None, Failure>> {
		// Meilisearch's addDocuments method also replaces the existing documents
		// https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents
		return this.add(collection, fields);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const task = await this.meilisearch
			.index(meiliCollectionIndex)
			.deleteDocument(id);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to delete document");

		return Ok(None);
	}
}

export function collectionToDocument(
	collection: Collection,
	fields: CollectionField[],
): CollectionDocument {
	return {
		id: collection.id,
		name: collection.name,
		topic: {
			id: collection.topic.id,
			name: collection.topic.name,
		},
		fields: fields.map((field) => ({
			collection: field.collection,
			id: field.id,
			name: field.name,
			type: field.type,
		})),
	};
}
