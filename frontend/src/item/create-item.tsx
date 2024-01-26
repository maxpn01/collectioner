import { CollectionFieldType, collectionLinkPresenter } from "@/collection";
import { userLinkPresenter } from "@/user";
import { Failure } from "@/utils/failure";
import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Err, Ok, Result } from "ts-results";
import { itemLinkPresenter } from ".";
import { ItemForm, UiItemForm } from "./form";
import env from "@/env";
import {
	ViewCollectionContext,
	ViewCollectionResponse,
} from "@/collection/view-collection";

type CreateItemServiceRequest = {
	name: string;
	collectionId: string;
	numberFields: ItemField<number>[];
	textFields: ItemField<string>[];
	multilineTextFields: ItemField<string>[];
	checkboxFields: ItemField<boolean>[];
	dateFields: ItemField<Date>[];
};

type CreateItemService = (
	req: CreateItemServiceRequest,
) => Promise<Result<NewItemId, Failure>>;

type ItemField<T extends number | string | boolean | Date> = {
	collectionFieldId: string;
	value: T;
};

type NewItemId = string;
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

	async execute(req: CreateItemRequest): Promise<Result<NewItemId, Failure>> {
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
		tags: form.tags.map((t) => t.value),
		name: form.name,
		numberFields: form.numberFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.numberFields[i].collectionFieldId,
				value: parseInt(`${field.value}`),
			};
		}),
		textFields: form.textFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.textFields[i].collectionFieldId,
				value: field.value,
			};
		}),
		multilineTextFields: form.multilineTextFields.map((field, i) => {
			return {
				collectionFieldId:
					collectionFields.multilineTextFields[i].collectionFieldId,
				value: field.value,
			};
		}),
		checkboxFields: form.checkboxFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.checkboxFields[i].collectionFieldId,
				value: field.value,
			};
		}),
		dateFields: form.dateFields.map((field, i) => {
			return {
				collectionFieldId: collectionFields.dateFields[i].collectionFieldId,
				value: field.value,
			};
		}),
	};
}

const httpCreateItemService: CreateItemService = async (
	req: CreateItemServiceRequest,
): Promise<Result<NewItemId, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/item`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(req),
		credentials: "include",
	});
	if (!res.ok) {
		return Err(new Failure());
	}
	const json = await res.json();

	return Ok(json.id);
};

// const dummyCreateItemService: CreateItemService = async () => {
// 	return Ok("test");
// };

const CreateItemUseCaseContext = createContext(
	new CreateItemUseCase(
		env.isProduction ? httpCreateItemService : httpCreateItemService,
	),
);

type UiCollectionField = {
	collectionFieldId: string;
	name: string;
};

function createItemPageStatePresenter(
	collection: ViewCollectionResponse,
): CreateItemPageState {
	return {
		numberFields: collection.fields
			.filter((field) => field.type === CollectionFieldType.Number)
			.map((field) => ({
				collectionFieldId: field.id,
				name: field.name,
			})),
		textFields: collection.fields
			.filter((field) => field.type === CollectionFieldType.Text)
			.map((field) => ({
				collectionFieldId: field.id,
				name: field.name,
			})),
		multilineTextFields: collection.fields
			.filter((field) => field.type === CollectionFieldType.MultilineText)
			.map((field) => ({
				collectionFieldId: field.id,
				name: field.name,
			})),
		checkboxFields: collection.fields
			.filter((field) => field.type === CollectionFieldType.Checkbox)
			.map((field) => ({
				collectionFieldId: field.id,
				name: field.name,
			})),
		dateFields: collection.fields
			.filter((field) => field.type === CollectionFieldType.Date)
			.map((field) => ({
				collectionFieldId: field.id,
				name: field.name,
			})),
	};
}

type CreateItemPageState = {
	numberFields: UiCollectionField[];
	textFields: UiCollectionField[];
	multilineTextFields: UiCollectionField[];
	checkboxFields: UiCollectionField[];
	dateFields: UiCollectionField[];
};

// const CreateItemPageStateContext = createContext<
// 	StatePromise<CreateItemPageState>
// >(
// 	Loaded(
// 		Ok({
// 			numberFields: [
// 				{
// 					id: "pages",
// 					name: "Pages",
// 				},
// 			],
// 			textFields: [
// 				{
// 					id: "author",
// 					name: "Author",
// 				},
// 			],
// 			multilineTextFields: [
// 				{
// 					id: "description",
// 					name: "Description",
// 				},
// 			],
// 			checkboxFields: [
// 				{
// 					id: "read",
// 					name: "Read",
// 				},
// 			],
// 			dateFields: [
// 				{
// 					id: "publish-date",
// 					name: "Publish date",
// 				},
// 			],
// 		}),
// 	),
// );

export function CreateItemPage() {
	const params = useParams();
	const navigate = useNavigate();
	const viewCollection = useContext(ViewCollectionContext);
	const createItem = useContext(CreateItemUseCaseContext);
	// const statePromise = useContext(CreateItemPageStateContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<CreateItemPageState>>(Loading);
	const [showsError, setShowsError] = useState(false);

	useEffect(() => {
		(async () => {
			const collectionId = params.collectionId;
			if (!collectionId) {
				console.error("No collection id");
				setStatePromise(Loaded(Err(new Failure())));
				return;
			}

			const result = await viewCollection.execute(collectionId);
			if (result.err) {
				console.error(result);
				setStatePromise(Loaded(result));
				return;
			}
			const collection = result.val;
			const state = createItemPageStatePresenter(collection);

			setStatePromise(Loaded(Ok(state)));
		})();
	}, []);

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
