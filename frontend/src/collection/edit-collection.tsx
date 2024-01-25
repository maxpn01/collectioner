import { Button } from "@/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/form";
import { Input } from "@/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/select";
import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { Plus } from "iconoir-react";
import { createContext, useContext, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { None, Ok, Option } from "ts-results";
import { CollectionFieldType, collectionFieldTypes } from ".";
import { CollectionNameField, CollectionTopicField } from "./form";
import { TopicsStateContext } from "./view-collection";
import { httpDeleteCollectionService } from "./delete-collection";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/ui";
import { CircleDashed } from "lucide-react";

type EditCollectionPageState = {
	id: string;
	name: string;
	imageOption: Option<string>;
	itemCount: number;
	topic: {
		id: string;
		name: string;
	};
	fields: {
		id: string;
		name: string;
		type: CollectionFieldType;
	}[];
};

const EditCollectionPageStateContext = createContext<
	StatePromise<EditCollectionPageState>
>(
	Loaded(
		Ok({
			id: "favbooks",
			name: "My favourite books",
			imageOption: None,
			itemCount: 17,
			topic: {
				id: "books",
				name: "Books",
			},
			fields: [
				{
					id: "pages",
					name: "Pages",
					type: CollectionFieldType.Number,
				},
			],
		}),
	),
);

type UiEditCollectionForm = {
	name: string;
	topicId: string;
	updatedFields: { id: string; name: string; type: CollectionFieldType }[];
	createdFields: { name: string; type: CollectionFieldType }[];
};

export function EditCollectionPage() {
	const statePromise = useContext(EditCollectionPageStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const collection = statePromiseResult.val;

	return (
		<>
			<EditCollectionForm {...collection} />
			<hr className="my-8" />
			<DangerZone collectionId={collection.id} />
		</>
	);
}

function EditCollectionForm(props: EditCollectionPageState) {
	const topicsPromise = useContext(TopicsStateContext);
	if (topicsPromise.loading) return <LoadingIndicator />;
	const topicsPromiseResult = topicsPromise.val;
	if (topicsPromiseResult.err) return <ErrorIndicator />;
	const topics = topicsPromiseResult.val;

	const form = useForm<UiEditCollectionForm>({
		defaultValues: {
			name: props.name,
			topicId: props.topic.id,
			updatedFields: props.fields,
			createdFields: [],
		},
	});
	const updatedFields = useFieldArray({
		name: "updatedFields",
		control: form.control,
	});
	const createdFields = useFieldArray({
		name: "createdFields",
		control: form.control,
	});

	return (
		<Form {...form}>
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-xl font-bold text-slate-800">Collection edit</h1>

				<Button>Save</Button>
			</div>
			<form className="space-y-8">
				<CollectionNameField form={form} />
				<CollectionTopicField
					form={form}
					topics={topics}
					defaultValue={props.topic.id}
				/>
				{updatedFields.fields.length > 0 && (
					<div>
						<h3 className="mb-2 font-bold text-slate-700">Fields</h3>
						{updatedFields.fields.map((field, index) => (
							<CollectionField
								key={field.id}
								index={index}
								namePrefix="updatedFields"
							/>
						))}
					</div>
				)}
				<div>
					{createdFields.fields.length > 0 && (
						<>
							<h3 className="mb-2 font-bold text-slate-700">New fields</h3>
							{createdFields.fields.map((field, index) => (
								<CollectionField
									key={field.id}
									index={index}
									namePrefix="createdFields"
								/>
							))}
						</>
					)}

					<Button
						onClick={() =>
							createdFields.append({
								name: "",
								type: CollectionFieldType.Text,
							})
						}
						type="button"
						variant="secondary"
						withIcon
					>
						<Plus className="mr-2" />
						New field
					</Button>
				</div>
			</form>
		</Form>
	);
}

function CollectionField({
	index,
	namePrefix,
}: {
	index: number;
	namePrefix: string;
}) {
	return (
		<div className="px-4 py-4 mb-4 space-y-4 rounded md:space-x-4 md:space-y-0 bg-slate-50 w-min md:flex">
			<FormField
				name={`${namePrefix}.${index}.name`}
				render={({ field, fieldState }) => (
					<FormItem>
						<FormLabel className="pl-2 font-bold text-slate-600">
							Name
						</FormLabel>
						<FormControl>
							<Input
								className="w-60"
								placeholder="Field name"
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						{fieldState.error && (
							<FormMessage>{fieldState.error.message}</FormMessage>
						)}
					</FormItem>
				)}
			/>
			<FormField
				name={`${namePrefix}.${index}.type`}
				render={({ field, fieldState }) => (
					<FormItem>
						<FormLabel className="pl-2 font-bold text-slate-600">
							Type
						</FormLabel>
						<FormControl>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className="w-60">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{collectionFieldTypes.map((fieldType) => (
										<SelectItem key={fieldType} value={fieldType}>
											{fieldType}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
						{fieldState.error && (
							<FormMessage>{fieldState.error.message}</FormMessage>
						)}
					</FormItem>
				)}
			/>
		</div>
	);
}

function DangerZone({ collectionId }: { collectionId: string }) {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	return (
		<>
			<h3 className="mt-8 mb-4 font-semibold text-slate-700">Danger zone</h3>
			<Button
				variant="outline"
				onClick={async () => {
					setIsLoading(true);
					await httpDeleteCollectionService(collectionId);
					navigate("../..", { relative: "path" });
				}}
				className={cn(
					"text-red-500 border-red-500 hover:text-red-500 hover:bg-red-50",
					isLoading && "pl-2 bg-red-200",
				)}
				disabled={isLoading}
			>
				<CircleDashed
					className={cn(
						"transition-all animate-spin",
						isLoading ? "w-5 mr-2" : "w-0",
					)}
				/>
				Delete collection
			</Button>
		</>
	);
}
