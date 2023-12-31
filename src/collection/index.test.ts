import { None } from "ts-results";
import { Collection, Topic } from ".";
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
