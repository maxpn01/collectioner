import { Result, Ok, None } from "ts-results";
import {
	ItemFieldRepositories,
	ItemFieldRepository,
	ItemRepository,
	generateItemFieldId,
} from ".";
import {
	CollectionField,
	CollectionFieldRepository,
	CollectionFieldType,
} from "..";
import { Failure } from "../../utils/failure";
import { User } from "../../user";
import { CommentRepository } from "./comments";

type ViewItemResponse = {
	id: string;
	name: string;
	tags: string[];
	numberFields: Map<CollectionFieldId, number>;
	textFields: Map<CollectionFieldId, string>;
	multilineTextFields: Map<CollectionFieldId, string>;
	checkboxFields: Map<CollectionFieldId, boolean>;
	dateFields: Map<CollectionFieldId, Date>;
	comments: {
		id: string;
		author: User;
		text: string;
		createdAt: Date;
	}[];
};

type CollectionFieldId = string;

export class ViewItemUseCase {
	collectionFieldRepository: CollectionFieldRepository;
	itemRepository: ItemRepository;
	commentRepository: CommentRepository;
	getItemFields: GetItemFields;

	constructor(
		collectionFieldRepository: CollectionFieldRepository,
		itemRepository: ItemRepository,
		itemFieldRepositories: ItemFieldRepositories,
		commentRepository: CommentRepository,
	) {
		this.collectionFieldRepository = collectionFieldRepository;
		this.itemRepository = itemRepository;
		this.commentRepository = commentRepository;
		this.getItemFields = new GetItemFields(itemFieldRepositories);
	}

	async execute(id: string): Promise<Result<ViewItemResponse, Failure>> {
		const itemResult = await this.itemRepository.get(id);
		if (itemResult.err) return itemResult;
		const item = itemResult.val;
		const collection = item.collection;

		const collectionFieldsResult =
			await this.collectionFieldRepository.getByCollection(collection.id);
		if (collectionFieldsResult.err) throw Error();
		const collectionFields = collectionFieldsResult.val;

		const fieldsResult = await this.getItemFields.execute(
			item.id,
			collectionFields,
		);
		if (fieldsResult.err) return fieldsResult;
		const fields = fieldsResult.val;

		const commentsResult = await this.commentRepository.getByItem(item.id);
		if (commentsResult.err) return commentsResult;
		const comments = commentsResult.val.map((comment) => ({
			id: comment.id,
			author: comment.author,
			text: comment.text,
			createdAt: comment.createdAt,
		}));

		return Ok({
			id,
			name: item.name,
			tags: item.tags,
			...fields,
			comments,
		});
	}
}

type ItemFields = {
	numberFields: Map<CollectionFieldId, number>;
	textFields: Map<CollectionFieldId, string>;
	multilineTextFields: Map<CollectionFieldId, string>;
	checkboxFields: Map<CollectionFieldId, boolean>;
	dateFields: Map<CollectionFieldId, Date>;
};

class GetItemFields {
	itemFieldRepositories: ItemFieldRepositories;

	constructor(itemFieldRepositories: ItemFieldRepositories) {
		this.itemFieldRepositories = itemFieldRepositories;
	}

	async execute(
		itemId: string,
		collectionFields: CollectionField[],
	): Promise<Result<ItemFields, Failure>> {
		let numberFields: Map<string, number> = new Map([]);
		let textFields: Map<string, string> = new Map([]);
		let multilineTextFields: Map<string, string> = new Map([]);
		let checkboxFields: Map<string, boolean> = new Map([]);
		let dateFields: Map<string, Date> = new Map([]);

		for (const collectionField of collectionFields) {
			let result: Result<None, Failure>;

			if (collectionField.type === CollectionFieldType.Number) {
				result = await this.getItemField(
					itemId,
					collectionField.id,
					numberFields,
					this.itemFieldRepositories.number,
				);
			}

			if (collectionField.type === CollectionFieldType.Text) {
				result = await this.getItemField(
					itemId,
					collectionField.id,
					textFields,
					this.itemFieldRepositories.text,
				);
			}

			if (collectionField.type === CollectionFieldType.MultilineText) {
				result = await this.getItemField(
					itemId,
					collectionField.id,
					multilineTextFields,
					this.itemFieldRepositories.multilineText,
				);
			}

			if (collectionField.type === CollectionFieldType.Checkbox) {
				result = await this.getItemField(
					itemId,
					collectionField.id,
					checkboxFields,
					this.itemFieldRepositories.checkbox,
				);
			}

			if (collectionField.type === CollectionFieldType.Date) {
				result = await this.getItemField(
					itemId,
					collectionField.id,
					dateFields,
					this.itemFieldRepositories.date,
				);
			}

			if (result! === undefined) throw new Error();
			if (result.err) return result;
		}

		return Ok({
			numberFields,
			textFields,
			multilineTextFields,
			checkboxFields,
			dateFields,
		});
	}

	async getItemField<T>(
		itemId: string,
		collectionFieldId: string,
		fields: Map<string, T>,
		repo: ItemFieldRepository<T>,
	): Promise<Result<None, Failure>> {
		const id = generateItemFieldId(itemId, collectionFieldId);
		const result = await repo.get(id);
		if (result.err) return result;
		const itemField = result.val;
		fields.set(id, itemField);
		return Ok(None);
	}
}
