import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "iconoir-react";
import { createContext, useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TopicsStateContext } from "../collection/view-collection";
import { Button } from "../components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../components/dialog";
import { Form } from "../components/form";
import { ErrorIndicator, LoadingIndicator } from "../utils/state-promise";
import { CollectionNameField, CollectionTopicField } from "./form";
import { None, Ok, Result } from "ts-results";
import { Failure } from "@/utils/failure";
import { useNavigate } from "react-router-dom";

type CreateCollectionServiceRequest = {
	ownerId: string;
	name: string;
	topicId: string;
};
type CreateCollectionService = (
	req: CreateCollectionServiceRequest,
) => Promise<Result<NewCollectionId, Failure>>;

type NewCollectionId = string;
type CreateCollectionRequest = {
	ownerId: string;
	name: string;
	topicId: string;
};
class CreateCollectionUseCase {
	createCollection: CreateCollectionService;
	constructor(createCollection: CreateCollectionService) {
		this.execute = this.execute.bind(this);
		this.createCollection = createCollection;
	}

	async execute(
		req: CreateCollectionRequest,
	): Promise<Result<NewCollectionId, Failure>> {
		return this.createCollection(req);
	}
}

const CreateCollectionUseCaseContext = createContext(
	new CreateCollectionUseCase(async () => Ok("newcollectionid")),
);

const createCollectionSchema = z.object({
	name: z.string(),
	topicId: z.string(),
});

export function NewCollectionButton(props: { ownerId: string }) {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const createCollection = useContext(CreateCollectionUseCaseContext);

	const onSubmit = async (form: any) => {
		const createCollectionResult = await createCollection.execute({
			...form,
			ownerId: props.ownerId,
		});
		if (createCollectionResult.err) throw new Error("Not implemented");
		const collectionId = createCollectionResult.val;

		setIsOpen(false);
		navigate(collectionId);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<Plus className="mr-2" />
					New collection
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New collection</DialogTitle>
				</DialogHeader>
				<CreateCollectionForm onSubmit={onSubmit} />
			</DialogContent>
		</Dialog>
	);
}

function CreateCollectionForm(props: { onSubmit: (form: any) => void }) {
	const topicsPromise = useContext(TopicsStateContext);
	if (topicsPromise.loading) return <LoadingIndicator />;
	const topicsPromiseResult = topicsPromise.val;
	if (topicsPromiseResult.err) return <ErrorIndicator />;
	const topics = topicsPromiseResult.val;

	const form = useForm({
		resolver: zodResolver(createCollectionSchema),
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(props.onSubmit)} className="space-y-4">
				<CollectionNameField form={form} />
				<CollectionTopicField form={form} topics={topics} />
				<DialogFooter>
					<Button type="submit">Save</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
