import { Item } from ".";
import { Collection } from "..";

export function createTestItem(id: string, collection: Collection): Item {
	return {
		id,
		collection,
		name: "",
		tags: [],
		createdAt: new Date(),
	};
}
