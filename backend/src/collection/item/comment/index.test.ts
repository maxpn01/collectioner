import { Comment } from ".";
import { Item } from "..";

export function createTestComment(
	id: string,
	authorId: string,
	item: Item,
): Comment {
	return {
		item,
		id,
		author: {
			id: authorId,
			email: "",
			username: "",
			fullname: "",
			blocked: false,
			isAdmin: false,
			passwordHash: "",
		},
		text: "",
		createdAt: new Date(),
	};
}
