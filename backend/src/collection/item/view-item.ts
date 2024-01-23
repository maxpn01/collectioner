import { Result, Ok, Option } from "ts-results";
import { ItemRepository } from ".";
import { Failure } from "../../utils/failure";
import { User } from "../../user";

type ViewItemResponse = {
	id: string;
	name: string;
	tags: Set<string>;
	collection: {
		id: string;
		name: string;
		owner: {
			id: string;
			username: string;
		};
	};
	fields: {
		numberFields: Map<CollectionFieldId, number>;
		textFields: Map<CollectionFieldId, string>;
		multilineTextFields: Map<CollectionFieldId, string>;
		checkboxFields: Map<CollectionFieldId, boolean>;
		dateFields: Map<CollectionFieldId, Date>;
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

		const numberFieldsMap = new Map<CollectionFieldId, number>();
		const textFieldsMap = new Map<CollectionFieldId, string>();
		const multilineTextFieldsMap = new Map<CollectionFieldId, string>();
		const checkboxFieldsMap = new Map<CollectionFieldId, boolean>();
		const dateFieldsMap = new Map<CollectionFieldId, Date>();

		fields.numberFields.forEach((numberField) => {
			numberFieldsMap.set(numberField.collectionField.id, numberField.value);
		});
		fields.textFields.forEach((textField) => {
			textFieldsMap.set(textField.collectionField.id, textField.value);
		});
		fields.multilineTextFields.forEach((multilineTextField) => {
			multilineTextFieldsMap.set(
				multilineTextField.collectionField.id,
				multilineTextField.value,
			);
		});
		fields.checkboxFields.forEach((checkboxField) => {
			checkboxFieldsMap.set(
				checkboxField.collectionField.id,
				checkboxField.value,
			);
		});
		fields.dateFields.forEach((dateField) => {
			dateFieldsMap.set(dateField.collectionField.id, dateField.value);
		});

		const responseFields = {
			numberFields: numberFieldsMap,
			textFields: textFieldsMap,
			multilineTextFields: multilineTextFieldsMap,
			checkboxFields: checkboxFieldsMap,
			dateFields: dateFieldsMap,
		};

		return Ok({
			id,
			name: item.name,
			tags: item.tags,
			collection: {
				id: item.collection.id,
				name: item.collection.name,
				owner: {
					id: item.collection.owner.id,
					username: item.collection.owner.username,
				},
			},
			fields: responseFields,
			comments,
		});
	}
}

export function viewItemHttpBodyPresenter(response: ViewItemResponse) {
	return {
		id: response.id,
		name: response.name,
		tags: Array.from(response.tags),
		collection: {
			id: response.collection.id,
			name: response.collection.name,
			owner: {
				id: response.collection.owner.id,
				username: response.collection.owner.username,
			},
		},
		fields: {
			numberFields: Array.from(response.fields.numberFields),
			textFields: Array.from(response.fields.textFields),
			multilineTextFields: Array.from(response.fields.multilineTextFields),
			checkboxFields: Array.from(response.fields.checkboxFields),
			dateFields: Array.from(response.fields.dateFields),
		},
		comments: response.comments.map((comment) => ({
			id: comment.id,
			author: comment.author,
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
