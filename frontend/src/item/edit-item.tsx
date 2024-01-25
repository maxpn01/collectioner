import { DangerButton } from "@/components/button";
import { Failure } from "@/utils/failure";
import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { cn } from "@/utils/ui";
import { CircleDashed } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { None, Ok, Result } from "ts-results";
import { httpDeleteItemService } from "./delete-item";
import { FormItemField, ItemForm, UiItemForm } from "./form";

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

const EditItemPageStateContext = createContext<StatePromise<EditItemPageState>>(
	Loaded(
		Ok({
			id: "thelordoftherings",
			name: "The Lord of the Rings",
			tags: [{ value: "fantasyorsmt" }],
			numberFields: [
				{
					collectionFieldId: "pages",
					name: "Pages",
					value: 1216,
				},
			],
			textFields: [
				{
					collectionFieldId: "author",
					name: "Author",
					value: "J.R.R. Tolkien",
				},
			],
			multilineTextFields: [
				{
					collectionFieldId: "description",
					name: "Description",
					value:
						"The Lord of the Rings is an epic high-fantasy novel written by English author and scholar J. R. R. Tolkien. The story began as a sequel to Tolkien's 1937 fantasy novel The Hobbit, but eventually developed into a much larger work. The Lord of the Rings was published in three volumes over the course of a year from 29 July 1954 to 20 October 1955.",
				},
			],
			checkboxFields: [
				{
					collectionFieldId: "read",
					name: "Read",
					value: true,
				},
			],
			dateFields: [
				{
					collectionFieldId: "publish-date",
					name: "Publish date",
					value: new Date("1954-07-29"),
				},
			],
		}),
	),
);

const EditItemUseCaseContext = createContext(
	new EditItemUseCase(async (req: EditItemServiceRequest) => {
		console.log(req);
		return Ok(None);
	}),
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

export function EditItemPage() {
	const statePromise = useContext(EditItemPageStateContext);
	const editItemUseCase = useContext(EditItemUseCaseContext);
	const [showsError, setShowsError] = useState(false);

	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const item = statePromiseResult.val;

	if (showsError) return <ErrorIndicator />;

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
						setShowsError(true);
						return;
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
