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
	Loading,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { Plus } from "iconoir-react";
import { createContext, useContext, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Err, None, Ok, Option, Result } from "ts-results";
import { CollectionFieldType, collectionFieldTypes } from ".";
import { CollectionNameField, CollectionTopicField } from "./form";
import {
	TopicsStateContext,
	ViewCollectionContext,
	ViewCollectionResponse,
} from "./view-collection";
import { httpDeleteCollectionService } from "./delete-collection";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/utils/ui";
import { CircleDashed } from "lucide-react";
import { DangerButton } from "@/components/button";
import { Failure } from "@/utils/failure";
import env from "@/env";

type EditCollectionRequest = {
	id: string;
	name: string;
	topicId: string;
	imageOption: Option<string>;
	updatedFields: EditCollectionRequestField[];
	createdFields: EditCollectionRequestNewField[];
};

type EditCollectionRequestField = {
	id: string;
	name: string;
	type: CollectionFieldType;
};

type EditCollectionRequestNewField = {
	name: string;
	type: CollectionFieldType;
};

type EditCollectionService = (
	req: EditCollectionRequest,
) => Promise<Result<None, Failure>>;

class EditCollectionUseCase {
	editCollection: EditCollectionService;

	constructor(editCollection: EditCollectionService) {
		this.execute = this.execute.bind(this);
		this.editCollection = editCollection;
	}

	async execute(req: EditCollectionRequest): Promise<Result<None, Failure>> {
		return this.editCollection(req);
	}
}

const httpEditCollectionService: EditCollectionService = async (
	req: EditCollectionRequest,
): Promise<Result<None, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/collection`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(req),
		credentials: "include",
	});
	if (!res.ok) return Err(new Failure());

	return Ok(None);
};

// const dummyEditCollectionService: EditCollectionService = async () => {
// 	return Ok(None);
// };

const EditCollectionUseCaseContext = createContext(
	new EditCollectionUseCase(
		env.isProduction ? httpEditCollectionService : httpEditCollectionService,
	),
);

type UiEditCollectionForm = {
	id: string;
	name: string;
	topicId: string;
	updatedFields: { id: string; name: string; type: CollectionFieldType }[];
	createdFields: { name: string; type: CollectionFieldType }[];
};

function editCollectionPageStatePresenter(
	collection: ViewCollectionResponse,
): EditCollectionPageState {
	return {
		id: collection.id,
		name: collection.name,
		imageOption: collection.imageOption,
		size: collection.size,
		topic: {
			id: collection.topic.id,
			name: collection.topic.name,
		},
		fields: collection.fields.map((field) => {
			return {
				...field,
			};
		}),
	};
}

type EditCollectionPageState = {
	id: string;
	name: string;
	imageOption: Option<string>;
	size: number;
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

export function EditCollectionPage() {
	const params = useParams();
	const viewCollection = useContext(ViewCollectionContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<EditCollectionPageState>>(Loading);

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
			const state = editCollectionPageStatePresenter(collection);

			setStatePromise(Loaded(Ok(state)));
		})();
	}, []);

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
	const navigate = useNavigate();
	const editCollection = useContext(EditCollectionUseCaseContext);

	const form = useForm<UiEditCollectionForm>({
		defaultValues: {
			id: props.id,
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

	const onSubmit = async (form: any) => {
		const editCollectionResult = await editCollection.execute({
			...form,
		});
		if (editCollectionResult.err) throw editCollectionResult;

		navigate("..", { relative: "path" });
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold text-slate-800">Collection edit</h1>

					<Button type="submit">Save</Button>
				</div>

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
			<DangerButton
				dialog={{
					title: "Delete collection",
					body: "Are you sure you want to delete this collection?",
					okButton: {
						label: "Delete collection",
						onClick: async () => {
							setIsLoading(true);
							await httpDeleteCollectionService(collectionId);
							navigate("../..", { relative: "path" });
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
				Delete collection
			</DangerButton>
		</>
	);
}
