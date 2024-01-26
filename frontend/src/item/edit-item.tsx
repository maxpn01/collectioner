import { DangerButton } from "@/components/button";
import { Failure } from "@/utils/failure";
import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { cn } from "@/utils/ui";
import { CircleDashed } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Err, None, Ok, Result } from "ts-results";
import { httpDeleteItemService } from "./delete-item";
import { FormItemField, ItemForm, UiItemForm } from "./form";
import env from "@/env";
import { Item, ViewItemUseCaseContext } from "./view-item";

type EditItemServiceRequest = {
	id: string;
	name: string;
	tags: string[];
	numberFields: ItemField<number>[];
	textFields: ItemField<string>[];
	multilineTextFields: ItemField<string>[];
	checkboxFields: ItemField<boolean>[];
	dateFields: ItemField<Date>[];
};

type EditItemService = (
	req: EditItemServiceRequest,
) => Promise<Result<None, Failure>>;

const httpEditItemService: EditItemService = async (
	req: EditItemServiceRequest,
): Promise<Result<None, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/item`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(req),
		credentials: "include",
	});
	if (!res.ok) {
		return Err(new Failure());
	}

	return Ok(None);
};

type ItemField<T extends number | string | boolean | Date> = {
	collectionFieldId: string;
	value: T;
};

type EditItemRequest = {
	id: string;
	name: string;
	tags: string[];
	numberFields: ItemField<number>[];
	textFields: ItemField<string>[];
	multilineTextFields: ItemField<string>[];
	checkboxFields: ItemField<boolean>[];
	dateFields: ItemField<Date>[];
};

class EditItemUseCase {
	private editItemService: EditItemService;

	constructor(editItemService: EditItemService) {
		this.editItemService = editItemService;
	}

	async execute(req: EditItemRequest): Promise<Result<None, Failure>> {
		return this.editItemService(req);
	}
}
type EditItemPageState = {
	id: string;
	name: string;
	tags: { value: string }[];
	numberFields: FormItemField<number>[];
	textFields: FormItemField<string>[];
	multilineTextFields: FormItemField<string>[];
	checkboxFields: FormItemField<boolean>[];
	dateFields: FormItemField<Date>[];
};

const EditItemUseCaseContext = createContext(
	new EditItemUseCase(
		env.isProduction ? httpEditItemService : httpEditItemService,
	),
);

export function formEditItemController(
	form: UiItemForm,
	item: EditItemPageState,
): EditItemRequest {
	return {
		id: item.id,
		name: form.name,
		tags: [],
		numberFields: form.numberFields.map((field, i) => {
			return {
				collectionFieldId: item.numberFields[i].collectionFieldId,
				value: parseInt(`${field.value}`),
			};
		}),
		textFields: form.textFields.map((field, i) => {
			return {
				collectionFieldId: item.textFields[i].collectionFieldId,
				value: field.value,
			};
		}),
		multilineTextFields: form.multilineTextFields.map((field, i) => {
			return {
				collectionFieldId: item.multilineTextFields[i].collectionFieldId,
				value: field.value,
			};
		}),
		checkboxFields: form.checkboxFields.map((field, i) => {
			return {
				collectionFieldId: item.checkboxFields[i].collectionFieldId,
				value: field.value,
			};
		}),
		dateFields: form.dateFields.map((field, i) => {
			return {
				collectionFieldId: item.dateFields[i].collectionFieldId,
				value: field.value,
			};
		}),
	};
}

function editItemPageStatePresenter(item: Item): EditItemPageState {
	return {
		...item,
		numberFields: item.fields.numberFields.map((field) => {
			return {
				...field,
				collectionFieldId: field.id,
			};
		}),
		textFields: item.fields.textFields.map((field) => {
			return {
				...field,
				collectionFieldId: field.id,
			};
		}),
		multilineTextFields: item.fields.multilineTextFields.map((field) => {
			return {
				...field,
				collectionFieldId: field.id,
			};
		}),
		checkboxFields: item.fields.checkboxFields.map((field) => {
			return {
				...field,
				collectionFieldId: field.id,
			};
		}),
		dateFields: item.fields.dateFields.map((field) => {
			return {
				...field,
				collectionFieldId: field.id,
			};
		}),
		tags: item.tags.map((tag: any) => ({ value: tag })),
	};
}

export function EditItemPage() {
	const params = useParams();
	const viewItem = useContext(ViewItemUseCaseContext);
	const editItemUseCase = useContext(EditItemUseCaseContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<EditItemPageState>>(Loading);

	useEffect(() => {
		(async () => {
			setStatePromise(Loading);
			const itemId = params.itemId!;
			if (!itemId) {
				setStatePromise(Loaded(Err(new Failure())));
			}
			const viewItemResult = await viewItem.execute(itemId);
			if (viewItemResult.err) {
				console.error(viewItemResult);
				setStatePromise(Loaded(viewItemResult));
				return;
			}
			const item = viewItemResult.val;
			const state = editItemPageStatePresenter(item);

			setStatePromise(Loaded(Ok(state)));
		})();
	}, [params.itemId]);

	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const item = statePromiseResult.val;

	return (
		<>
			<ItemForm
				defaultValues={{
					name: item.name,
					numberFields: item.numberFields,
					textFields: item.textFields,
					multilineTextFields: item.multilineTextFields,
					checkboxFields: item.checkboxFields,
					dateFields: item.dateFields,
				}}
				onSubmit={async (form) => {
					const req = formEditItemController(form, item);
					const editItemResult = await editItemUseCase.execute(req);
					if (editItemResult.err) {
						console.error(editItemResult);
						throw new Error("Not implemented");
					}
				}}
			/>
			<DangerZone itemId={item.id} />
		</>
	);
}

function DangerZone({ itemId }: { itemId: string }) {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	return (
		<>
			<h3 className="mt-8 mb-4 font-semibold text-slate-700">Danger zone</h3>
			<DangerButton
				dialog={{
					title: "Delete collection",
					body: "Are you sure you want to delete this collection?",
					okButton: {
						label: "Delete collection",
						onClick: async () => {
							setIsLoading(true);
							await httpDeleteItemService(itemId);
							navigate("../../..", { relative: "path" });
						},
					},
				}}
				variant="outline"
				className={cn(isLoading && "pl-2 bg-red-200")}
				disabled={isLoading}
			>
				<CircleDashed
					className={cn(
						"transition-all animate-spin",
						isLoading ? "w-5 mr-2" : "w-0",
					)}
				/>
				Delete Item
			</DangerButton>
		</>
	);
}
