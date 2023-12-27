import "node";

type User = {
	id: string;
	email: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
};
type Topic = {
	id: string;
	name: string;
};
type Collection = {
	owner: User;
	id: string;
	name: string;
	items: Item[];
	topic: Topic;
	image: Buffer;
	numberFields: ItemField[];
	textFields: ItemField[];
	multilineTextFields: ItemField[];
	checkboxFields: ItemField[];
	dateFields: ItemField[];
};
type Item = {
	id: string;
	name: string;
	tags: string[];
	createdAt: Date;
	numberFields: NumberField[];
	textFields: TextField[];
	multilineTextFields: MultilineTextField[];
	checkboxFields: CheckboxField[];
	dateFields: DateField[];
	likes: Like[];
};
type ItemField = {
	id: string;
	name: string;
};
type NumberField = {
	field: ItemField;
	value: number;
};
type TextField = {
	field: ItemField;
	value: string;
};
type MultilineTextField = {
	field: ItemField;
	value: string;
};
type CheckboxField = {
	field: ItemField;
	value: boolean;
};
type DateField = {
	field: ItemField;
	value: Date;
};

type Comment = {
	id: string;
	author: User;
	text: string;
	createdAt: Date;
	// likes: Like[]; TODO: Implement if enough time
};

type Like = {
	author: User;
};
