import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext } from "react";
import { Ok } from "ts-results";
import { ItemForm } from "./form";

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

export const createItemPageRoute = "/item/create" as const;
export function CreateItemPage() {
	const statePromise = useContext(CreateItemPageStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const state = statePromiseResult.val;

	return (
		<ItemForm
			defaultValues={{
				numberFields: state.numberFields,
				textFields: state.textFields,
				multilineTextFields: state.multilineTextFields,
				checkboxFields: state.checkboxFields,
				dateFields: state.dateFields,
			}}
		/>
	);
}
