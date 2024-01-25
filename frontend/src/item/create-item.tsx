import { collectionLinkPresenter } from "@/collection";
import { userLinkPresenter } from "@/user";
import { Failure } from "@/utils/failure";
import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Ok, Result } from "ts-results";
import { itemLinkPresenter } from ".";
import { ItemForm, UiItemForm } from "./form";

type CreateItemServiceRequest = {
	name: string;
	collectionId: string;
	numberFields: ItemField<number>[];
	textFields: ItemField<string>[];
	multilineTextFields: ItemField<string>[];
	checkboxFields: ItemField<boolean>[];
	dateFields: ItemField<Date>[];
};

type ItemId = string;
type CreateItemService = (
	req: CreateItemServiceRequest,
) => Promise<Result<ItemId, Failure>>;

type ItemField<T extends number | string | boolean | Date> = {
	collectionFieldId: string;
	value: T;
};

type CreateItemRequest = {
	name: string;
	tags: string[];
	collectionId: string;
	numberFields: ItemField<number>[];
	textFields: ItemField<string>[];
	multilineTextFields: ItemField<string>[];
	checkboxFields: ItemField<boolean>[];
	dateFields: ItemField<Date>[];
};
class CreateItemUseCase {
	createCollection: CreateItemService;
	constructor(createCollection: CreateItemService) {
		this.execute = this.execute.bind(this);
		this.createCollection = createCollection;
	}

	async execute(req: CreateItemRequest): Promise<Result<ItemId, Failure>> {
		return this.createCollection(req);
	}
}

export function formCreateItemController(
	form: UiItemForm,
	collectionId: string,
	collectionFields: CreateItemPageState,
): CreateItemRequest {
	return {
		collectionId,
		tags: [],
		name: form.name,
		numberFields: form.numberFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.numberFields[i].id,
				value: field.value,
			};
		}),
		textFields: form.textFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.textFields[i].id,
				value: field.value,
			};
		}),
		multilineTextFields: form.multilineTextFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.multilineTextFields[i].id,
				value: field.value,
			};
		}),
		checkboxFields: form.checkboxFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.checkboxFields[i].id,
				value: field.value,
			};
		}),
		dateFields: form.dateFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.dateFields[i].id,
				value: field.value,
			};
		}),
	};
}

const CreateItemUseCaseContext = createContext(
	new CreateItemUseCase(async () => Ok("test")),
);

type UiCollectionField = {
	id: string;
	name: string;
};

type CreateItemPageState = {
	numberFields: UiCollectionField[];
	textFields: UiCollectionField[];
	multilineTextFields: UiCollectionField[];
	checkboxFields: UiCollectionField[];
	dateFields: UiCollectionField[];
};

const CreateItemPageStateContext = createContext<
	StatePromise<CreateItemPageState>
>(
	Loaded(
		Ok({
			numberFields: [
				{
					id: "pages",
					name: "Pages",
				},
			],
			textFields: [
				{
					id: "author",
					name: "Author",
				},
			],
			multilineTextFields: [
				{
					id: "description",
					name: "Description",
				},
			],
			checkboxFields: [
				{
					id: "read",
					name: "Read",
				},
			],
			dateFields: [
				{
					id: "publish-date",
					name: "Publish date",
				},
			],
		}),
	),
);

export function CreateItemPage() {
	const params = useParams();
	const navigate = useNavigate();
	const createItem = useContext(CreateItemUseCaseContext);
	const statePromise = useContext(CreateItemPageStateContext);
	const [showsError, setShowsError] = useState(false);

	if (params.username === undefined) return <ErrorIndicator />;
	const username = params.username;

	if (params.collectionId === undefined) return <ErrorIndicator />;
	const collectionId = params.collectionId;

	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const collectionFields = statePromiseResult.val;

	if (showsError) return <ErrorIndicator />;

	return (
		<ItemForm
			defaultValues={{
				numberFields: collectionFields.numberFields,
				textFields: collectionFields.textFields,
				multilineTextFields: collectionFields.multilineTextFields,
				checkboxFields: collectionFields.checkboxFields.map((field) => ({
					...field,
					value: false,
				})),
				dateFields: collectionFields.dateFields,
			}}
			onSubmit={async (form) => {
				const req = formCreateItemController(
					form,
					collectionId,
					collectionFields,
				);
				const createItemResult = await createItem.execute(req);
				if (createItemResult.err) {
					console.error(createItemResult);
					setShowsError(true);
					return;
				}
				const itemId = createItemResult.val;

				const itemLink = itemLinkPresenter(
					itemId,
					collectionLinkPresenter(collectionId, userLinkPresenter(username)),
				);

				navigate(itemLink);
			}}
		/>
	);
}
