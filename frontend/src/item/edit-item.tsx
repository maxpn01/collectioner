import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext } from "react";
import { Ok } from "ts-results";
import { ItemForm } from "./form";

type UiItemField<T> = {
	id: string;
	name: string;
	value: T;
};

type EditItemPageState = {
	id: string;
	name: string;
	numberFields: UiItemField<number>[];
	textFields: UiItemField<string>[];
	multilineTextFields: UiItemField<string>[];
	checkboxFields: UiItemField<boolean>[];
	dateFields: UiItemField<Date>[];
};

const CreateItemPageStateContext = createContext<
	StatePromise<EditItemPageState>
>(
	Loaded(
		Ok({
			id: "thelordoftherings",
			name: "The Lord of the Rings",
			numberFields: [
				{
					id: "pages",
					name: "Pages",
					value: 1216,
				},
			],
			textFields: [
				{
					id: "author",
					name: "Author",
					value: "J.R.R. Tolkien",
				},
			],
			multilineTextFields: [
				{
					id: "description",
					name: "Description",
					value:
						"The Lord of the Rings is an epic high-fantasy novel written by English author and scholar J. R. R. Tolkien. The story began as a sequel to Tolkien's 1937 fantasy novel The Hobbit, but eventually developed into a much larger work. The Lord of the Rings was published in three volumes over the course of a year from 29 July 1954 to 20 October 1955.",
				},
			],
			checkboxFields: [
				{
					id: "read",
					name: "Read",
					value: true,
				},
			],
			dateFields: [
				{
					id: "publish-date",
					name: "Publish date",
					value: new Date("1954-07-29"),
				},
			],
		}),
	),
);

export const editItemPageRoute = "/item/edit" as const;
export function EditItemPage() {
	const statePromise = useContext(CreateItemPageStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const state = statePromiseResult.val;

	return (
		<ItemForm
			defaultValues={{
				name: state.name,
				numberFields: state.numberFields,
				textFields: state.textFields,
				multilineTextFields: state.multilineTextFields,
				checkboxFields: state.checkboxFields,
				dateFields: state.dateFields,
			}}
		/>
	);
}
