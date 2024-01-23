import { Button } from "@/components/button";
import { EditPencil, Message } from "iconoir-react";
import React, { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { Ok } from "ts-results";
import { Table, TableBody, TableCell, TableRow } from "../components/table";
import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "../utils/state-promise";
import { editItemPageRoute } from "./edit-item";
import { collectionPageRoute } from "@/collection/view-collection";
import { userPageRoute } from "@/user/view-user";

type UiItemField<T> = {
	id: string;
	name: string;
	value: T;
};

type UiComment = {
	id: string;
	author: {
		id: string;
		username: string;
		fullname: string;
		blocked: boolean;
	};
	text: string;
	createdAt: string;
};

type ItemPageState = {
	editable: boolean;
	id: string;
	name: string;
	tags: string[];
	createdAt: string;
	collection: {
		id: string;
		name: string;
		owner: {
			id: string;
			username: string;
		};
	};
	fields: {
		numberFields: UiItemField<string>[];
		textFields: UiItemField<string>[];
		multilineTextFields: UiItemField<string>[];
		checkboxFields: UiItemField<string>[];
		dateFields: UiItemField<string>[];
	};
	comments: UiComment[];
};

const ItemPageStateContext = createContext<StatePromise<ItemPageState>>(
	Loaded(
		Ok({
			editable: false,
			id: "lordoftherings",
			name: "The Lord of the Rings",
			tags: ["fantasy", "epic"],
			createdAt: "Today",
			collection: {
				id: "myfavouritebooks",
				name: "My favourite books",
				owner: {
					id: "john",
					username: "john",
				},
			},
			fields: {
				numberFields: [
					{
						id: "page",
						name: "Pages",
						value: "1216",
					},
					{
						id: "words",
						name: "Words",
						value: "483359",
					},
				],
				textFields: [
					{
						id: "author",
						name: "Author",
						value: "J.R.R. Tolkien",
					},
					{
						id: "publisher",
						name: "Publisher",
						value: "George Allen & Unwin",
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
				checkboxFields: [],
				dateFields: [
					{
						id: "publishDate",
						name: "Publish date",
						value: "1954-07-29",
					},
				],
			},
			comments: [
				{
					id: "1",
					author: {
						id: "1",
						username: "johndoe",
						fullname: "John Doe",
						blocked: false,
					},
					text: "This is one of my all-time favorite books!",
					createdAt: "Today",
				},
				{
					id: "2",
					author: {
						id: "2",
						username: "janedoe",
						fullname: "Jane Doe",
						blocked: false,
					},
					text: "I've read this book so many times, I've lost count!",
					createdAt: "Today",
				},
				{
					id: "3",
					author: {
						id: "3",
						username: "bobsmith",
						fullname: "Bob Smith",
						blocked: true,
					},
					text: "I'm currently reading this book for the first time and I'm loving it!",
					createdAt: "Today",
				},
				{
					id: "4",
					author: {
						id: "4",
						username: "alicesmith",
						fullname: "Alice Smith",
						blocked: false,
					},
					text: "I've seen the movies, but I've never read the books. I think it's time I give them a try!",
					createdAt: "Today",
				},
				{
					id: "5",
					author: {
						id: "5",
						username: "charliebrown",
						fullname: "Charlie Brown",
						blocked: false,
					},
					text: "I've always wanted to read this book, but it's so long! I don't know if I'll be able to finish it.",
					createdAt: "Today",
				},
				{
					id: "6",
					author: {
						id: "6",
						username: "sallysmith",
						fullname: "Sally Smith",
						blocked: false,
					},
					text: "I've read this book multiple times and I always find something new to appreciate about it.",
					createdAt: "Today",
				},
				{
					id: "7",
					author: {
						id: "7",
						username: "lucyjones",
						fullname: "Lucy Jones",
						blocked: false,
					},
					text: "I'm a big fan of fantasy novels and this is one of the best I've ever read.",
					createdAt: "Today",
				},
			],
		}),
	),
);

export const itemPageRoute = "/item" as const;
export function ItemPage() {
	const itemPagePromise = useContext(ItemPageStateContext);
	if (itemPagePromise.loading) return <LoadingIndicator />;
	const itemPageResult = itemPagePromise.val;
	if (itemPageResult.err) return <ErrorIndicator />;
	const state = itemPageResult.val;

	return (
		<>
			<div className="flex mb-4 gap-x-2">
				<Link
					to={userPageRoute}
					className="font-medium underline text-slate-700 text"
				>
					@{state.collection.owner.username}
				</Link>
				<span>/</span>
				<Link
					to={collectionPageRoute}
					className="font-medium underline text-slate-700 text"
				>
					{state.collection.name}
				</Link>
				<span className="ml-auto text-slate-600">{state.createdAt}</span>
			</div>
			<div className="justify-between mt-4 mb-8 md:flex">
				<div className="mb-4 md:mb-0">
					<h1 className="mb-1 font-serif text-3xl font-bold text-slate-800">
						{state.name}
					</h1>
					<p className="flex flex-wrap items-center gap-2 text-slate-600">
						{state.tags.map((tag, index) => (
							<React.Fragment key={index}>#{tag} </React.Fragment>
						))}
					</p>
				</div>
				{state.editable && (
					<Button variant="outline" className="md:mt-1" asChild>
						<Link to={editItemPageRoute}>
							<EditPencil className="mr-2" />
							Edit
						</Link>
					</Button>
				)}
			</div>

			<Table className="w-max">
				<colgroup>
					<col className="w-48" />
					<col className="" />
				</colgroup>
				<TableBody>
					<ItemFieldRows itemFields={state.fields.textFields} />
					<ItemFieldRows itemFields={state.fields.dateFields} />
					<ItemFieldRows itemFields={state.fields.numberFields} />
					<ItemFieldRows itemFields={state.fields.checkboxFields} />
				</TableBody>
			</Table>

			{state.fields.multilineTextFields.map(({ id, name, value }) => (
				<React.Fragment key={id}>
					<h3 className="mt-4 mb-2 font-semibold text-slate-700">{name}</h3>
					<p className="whitespace-pre-wrap">{value}</p>
				</React.Fragment>
			))}

			<h2 className="mt-8 mb-4 font-semibold text-slate-700">Comments</h2>
			<Comments comments={state.comments} />
		</>
	);
}

function ItemFieldRows({ itemFields }: { itemFields: UiItemField<string>[] }) {
	return itemFields.map(({ id, name, value }) => (
		<TableRow key={id}>
			<TableCell className="pl-0 text-base font-semibold text-slate-700">
				{name}
			</TableCell>
			<TableCell className="pl-0">{value}</TableCell>
		</TableRow>
	));
}

function Comments(props: {
	comments: {
		id: string;
		author: {
			id: string;
			username: string;
			fullname: string;
			blocked: boolean;
		};
		text: string;
		createdAt: string;
	}[];
}) {
	return (
		<ul className="py-2 space-y-6 list-none list-inside">
			{props.comments.map((comment) => (
				<li key={comment.id} className="rounded-md">
					<div className="mb-1 text-sm">
						<Message className="inline-block mr-1 text-slate-500" />
						<span className="font-bold">@{comment.author.username}</span>
						<span className="inline-block ml-2 lowercase text-slate-700">
							{comment.createdAt}
						</span>
					</div>
					<p className="p-1">{comment.text}</p>
				</li>
			))}
		</ul>
	);
}
