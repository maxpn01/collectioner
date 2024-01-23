import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "iconoir-react";
import { useContext, useState } from "react";
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

const createCollectionSchema = z.object({
	name: z.string(),
	topicId: z.string(),
});

export function NewCollectionButton() {
	const [isOpen, setIsOpen] = useState(false);

	const onSubmit = (values: any) => {
		console.log(values);
		setIsOpen(false);
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
