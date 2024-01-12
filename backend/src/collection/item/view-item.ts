import { Result, Ok } from "ts-results";
import { ItemRepository } from ".";
import { Failure } from "../../utils/failure";
import { User } from "../../user";

type ViewItemResponse = {
	id: string;
	name: string;
	tags: Set<string>;
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
			fields: responseFields,
			comments,
		});
	}
}
