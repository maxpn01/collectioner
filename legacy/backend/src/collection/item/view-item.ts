import { Result, Ok, Option } from "ts-results";
import { ItemRepository } from ".";
import { Failure } from "../../utils/failure";
import { User } from "../../user";

type ItemField<T> = {
	id: string;
	name: string;
	value: T;
};

type ViewItemResponse = {
	id: string;
	name: string;
	tags: Set<string>;
	createdAt: Date;
	collection: {
		id: string;
		name: string;
		owner: {
			id: string;
			username: string;
		};
	};
	fields: {
		numberFields: ItemField<number>[];
		textFields: ItemField<string>[];
		multilineTextFields: ItemField<string>[];
		checkboxFields: ItemField<boolean>[];
		dateFields: ItemField<Date>[];
	};
	comments: {
		id: string;
		author: User;
		text: string;
		createdAt: Date;
	}[];
};

type CollectionFieldId = string;

export class ViewItemUseCase {
	itemRepository: ItemRepository;

	constructor(itemRepository: ItemRepository) {
		this.itemRepository = itemRepository;
	}

	async execute(id: string): Promise<Result<ViewItemResponse, Failure>> {
		const itemResult = await this.itemRepository.get(id, {
			include: { fields: true, comments: true },
		});
		if (itemResult.err) return itemResult;
		const { item, fields, comments } = itemResult.val;

		const numberFields = fields.numberFields.map((numberField) => {
			return {
				id: numberField.collectionField.id,
				name: numberField.collectionField.name,
				value: numberField.value,
			};
		});

		const textFields = fields.textFields.map((textField) => {
			return {
				id: textField.collectionField.id,
				name: textField.collectionField.name,
				value: textField.value,
			};
		});

		const multilineTextFields = fields.multilineTextFields.map(
			(multilineTextField) => {
				return {
					id: multilineTextField.collectionField.id,
					name: multilineTextField.collectionField.name,
					value: multilineTextField.value,
				};
			},
		);

		const checkboxFields = fields.checkboxFields.map((checkboxField) => {
			return {
				id: checkboxField.collectionField.id,
				name: checkboxField.collectionField.name,
				value: checkboxField.value,
			};
		});

		const dateFields = fields.dateFields.map((dateField) => {
			return {
				id: dateField.collectionField.id,
				name: dateField.collectionField.name,
				value: dateField.value,
			};
		});

		return Ok({
			id,
			name: item.name,
			tags: item.tags,
			createdAt: item.createdAt,
			collection: {
				id: item.collection.id,
				name: item.collection.name,
				owner: {
					id: item.collection.owner.id,
					username: item.collection.owner.username,
				},
			},
			fields: {
				numberFields,
				textFields,
				multilineTextFields,
				checkboxFields,
				dateFields,
			},
			comments,
		});
	}
}

export function viewItemHttpBodyPresenter(response: ViewItemResponse) {
	return {
		id: response.id,
		name: response.name,
		tags: Array.from(response.tags),
		createdAt: response.createdAt,
		collection: {
			id: response.collection.id,
			name: response.collection.name,
			owner: {
				id: response.collection.owner.id,
				username: response.collection.owner.username,
			},
		},
		fields: response.fields,
		comments: response.comments.map((comment) => ({
			id: comment.id,
			author: {
				id: comment.author.id,
				username: comment.author.username,
				fullname: comment.author.fullname,
				blocked: comment.author.blocked,
			},
			text: comment.text,
			createdAt: comment.createdAt,
		})),
	};
}

import { Request, Response } from "express";
import { idController } from "../../utils/id";
import { expressSendHttpFailure, httpFailurePresenter } from "../../http";

export class ExpressViewItem {
	viewItem: ViewItemUseCase;

	constructor(viewItem: ViewItemUseCase) {
		this.execute = this.execute.bind(this);
		this.viewItem = viewItem;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = idController(req.query.id);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const id = controllerResult.val;

		const viewItemResult = await this.viewItem.execute(id);
		if (viewItemResult.err) {
			const failure = viewItemResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const item = viewItemResult.val;

		const httpBodyItem = viewItemHttpBodyPresenter(item);

		res.status(200).json(httpBodyItem);
	}
}
