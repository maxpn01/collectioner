import { Collection, ItemField } from "..";
import { User } from "../../user";

type Item = {
	collection: Collection;
	id: string;
	name: string;
	tags: string[];
	createdAt: Date;
};

type ItemLike = {
	item: Item;
	author: User;
};

type NumberField = {
	item: Item;
	id: string;
	field: ItemField;
	value: number;
};
type TextField = {
	item: Item;
	id: string;
	field: ItemField;
	value: string;
};
type MultilineTextField = {
	item: Item;
	id: string;
	field: ItemField;
	value: string;
};
type CheckboxField = {
	item: Item;
	id: string;
	field: ItemField;
	value: boolean;
};
type DateField = {
	item: Item;
	id: string;
	field: ItemField;
	value: Date;
};

type Comment = {
	item: Item;
	id: string;
	author: User;
	text: string;
	createdAt: Date;
	// likes: CommentLike[]; TODO: Implement if enough time
};

// type CommentLike = {
// 	comment: Comment;
// 	author: User;
// };
