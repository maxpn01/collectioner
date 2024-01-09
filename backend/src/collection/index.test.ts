import { None } from "ts-results";
import { Collection, CollectionField, CollectionFieldType, Topic } from ".";
import { User } from "../user";

export function createTestCollection(
	id: string,
	owner: User,
	topic: Topic,
): Collection {
	return {
		id,
		owner,
		topic,
		name: "",
		imageOption: None,
	};
}

export function createTestTopic(id: string): Topic {
	return {
		id,
		name: "",
	};
}

export function createTestCollectionField(
	id: string,
	type: CollectionFieldType,
	collection: Collection,
): CollectionField {
	return {
		id,
		type,
		collection,
		name: "",
	};
}
