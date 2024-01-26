import { Button } from "@/components/button";
import { Textarea } from "@/components/textarea";
import env from "@/env";
import { userLinkPresenter } from "@/user";
import { formatDateRelative } from "@/utils/date";
import { Failure } from "@/utils/failure";
import { formatDate } from "date-fns";
import { EditPencil, Message } from "iconoir-react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Err, Ok, Result } from "ts-results";
import { Table, TableBody, TableCell, TableRow } from "../components/table";
import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "../utils/state-promise";
import { CreateCommentUseCaseContext } from "@/comment/create-comment";
import { httpDeleteCommentService } from "@/comment/delete-comment";
import {
	AuthenticatedUserRepository,
	localStorageAuthenticatedUserRepository,
} from "@/user/auth";

type ItemField<T> = {
	id: string;
	name: string;
	value: T;
};

export type Comment = {
	id: string;
	author: {
		id: string;
		username: string;
		blocked: boolean;
	};
	text: string;
	createdAt: Date;
};

export type Item = {
	id: string;
	name: string;
	tags: string[];
	createdAt: Date;
	collection: {
		id: string;
		name: string;
		owner: {
			id: string;
			username: string;
		};
	};
	fields: {
		numberFields: ItemField<number>[];
		textFields: ItemField<string>[];
		multilineTextFields: ItemField<string>[];
		checkboxFields: ItemField<boolean>[];
		dateFields: ItemField<Date>[];
	};
	comments: Comment[];
};

type ViewItemService = (id: string) => Promise<Result<Item, Failure>>;

const httpViewItemService: ViewItemService = async (id) => {
	const res = await fetch(`${env.backendApiBase}/item?id=${id}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	if (!res.ok) return Err(new Failure());
	const json = await res.json();

	return Ok({
		...json,
		createdAt: new Date(json.createdAt),
		fields: {
			...json.fields,
			dateFields: json.fields.dateFields.map(
				mapItemField((val: any) => new Date(val)),
			),
		},
		comments: json.comments.map((comment: any) => {
			return {
				...comment,
				createdAt: new Date(comment.createdAt),
			};
		}),
	});
};

export type ViewItemResponseComment = {
	id: string;
	author: {
		id: string;
		username: string;
		blocked: boolean;
	};
	text: string;
	createdAt: Date;
	editable: boolean;
};

type ViewItemResponse = {
	id: string;
	name: string;
	editable: boolean;
	tags: string[];
	createdAt: Date;
	collection: {
		id: string;
		name: string;
		owner: {
			id: string;
			username: string;
		};
	};
	fields: {
		numberFields: ItemField<number>[];
		textFields: ItemField<string>[];
		multilineTextFields: ItemField<string>[];
		checkboxFields: ItemField<boolean>[];
		dateFields: ItemField<Date>[];
	};
	comments: ViewItemResponseComment[];
};

class ViewItemUseCase {
	viewItem: ViewItemService;
	authenticatedUserRepository: AuthenticatedUserRepository;

	constructor(
		viewItem: ViewItemService,
		authenticatedUserRepository: AuthenticatedUserRepository,
	) {
		this.execute = this.execute.bind(this);
		this.viewItem = viewItem;
		this.authenticatedUserRepository = authenticatedUserRepository;
	}

	async execute(id: string): Promise<Result<ViewItemResponse, Failure>> {
		const authenticatedUserResult = this.authenticatedUserRepository.get();

		const result = await this.viewItem(id);

		if (authenticatedUserResult.none) {
			return result.map((item) => {
				return {
					...item,
					comments: item.comments.map((comment) => {
						return {
							...comment,
							editable: false,
						};
					}),
					editable: false,
				};
			});
		}
		const authenticatedUser = authenticatedUserResult.val;

		return result.map((item) => {
			const editable =
				authenticatedUser.isAdmin ||
				authenticatedUser.id === item.collection.owner.id;

			return {
				...item,
				comments: item.comments.map((comment) => {
					const editable =
						authenticatedUser.isAdmin ||
						authenticatedUser.id === comment.author.id;

					return {
						...comment,
						editable,
					};
				}),
				editable,
			};
		});
	}
}

function mapItemField<T, R>(
	map: (value: T) => R,
): (itemField: ItemField<T>) => ItemField<R> {
	return (itemField) => ({
		...itemField,
		value: map(itemField.value),
	});
}

function viewItemPresenter(
	itemOrFailure: Result<ViewItemResponse, Failure>,
): Result<ItemPageState, Failure> {
	return itemOrFailure.map((item) => {
		const ownerLink = `/${item.collection.owner.username}`;
		const collectionLink = `${ownerLink}/${item.collection.id}`;

		const state: ItemPageState = {
			id: item.id,
			name: item.name,
			editable: item.editable,
			editLink: `${collectionLink}/items/${item.id}/edit`,
			collection: {
				...item.collection,
				link: collectionLink,
				owner: {
					...item.collection.owner,
					link: ownerLink,
				},
			},
			createdAt: formatDateRelative(item.createdAt),
			comments: item.comments.map(uiCommentPresenter),
			fields: {
				textFields: item.fields.textFields,
				multilineTextFields: item.fields.multilineTextFields,
				numberFields: item.fields.numberFields.map(mapItemField((n) => `${n}`)),
				checkboxFields: item.fields.checkboxFields.map(
					mapItemField((bool) => (bool ? "Yes" : "No")),
				),
				dateFields: item.fields.dateFields.map(
					mapItemField((date) => formatDate(date, "dd-MM-yyyy")),
				),
			},
			tags: item.tags,
		};

		return state;
	});
}

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
		blocked: boolean;
		link: string;
	};
	text: string;
	editable: boolean;
	createdAt: string;
};

type ItemPageState = {
	editable: boolean;
	id: string;
	editLink: string;
	name: string;
	tags: string[];
	createdAt: string;
	collection: {
		id: string;
		name: string;
		link: string;
		owner: {
			id: string;
			username: string;
			link: string;
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

const dummyViewItemService: ViewItemService = async (id) => {
	return Ok({
		id,
		name: "The Lord of the Rings",
		tags: ["fantasy", "epic"],
		createdAt: new Date("2023-12-12T10:15:30"),
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
					value: 1216,
				},
				{
					id: "words",
					name: "Words",
					value: 483359,
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
					value: new Date("1954-07-29T08:20:45"),
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
				createdAt: new Date("2024-01-22T14:05:00"),
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
				createdAt: new Date("2024-01-22T16:30:20"),
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
				createdAt: new Date("2024-01-23T09:45:10"),
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
				createdAt: new Date("2024-01-20T12:12:12"),
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
				createdAt: new Date("2024-01-15T11:11:11"),
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
				createdAt: new Date("2024-01-02T18:18:18"),
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
				createdAt: new Date("2024-01-22T20:20:20"),
			},
		],
	});
};

function uiCommentPresenter(comment: ViewItemResponseComment): UiComment {
	return {
		id: comment.id,
		author: {
			id: comment.author.id,
			blocked: comment.author.blocked,
			link: userLinkPresenter(comment.author.username),
			username: comment.author.username,
		},
		createdAt: formatDateRelative(comment.createdAt),
		text: comment.text,
		editable: comment.editable,
	};
}

export const ViewItemUseCaseContext = createContext<ViewItemUseCase>(
	new ViewItemUseCase(
		env.isProduction ? httpViewItemService : httpViewItemService,
		localStorageAuthenticatedUserRepository,
	),
);

export function ItemPage() {
	const viewItem = useContext(ViewItemUseCaseContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<ItemPageState>>(Loading);

	const params = useParams();

	useEffect(() => {
		(async () => {
			const itemId = params.itemId;
			if (!itemId) {
				console.error("Item ID not specified");
				setStatePromise(Loaded(Err(new Failure())));
				return;
			}
			setStatePromise(Loading);
			const userOrFailure = await viewItem.execute(itemId);
			const stateOrFailure = viewItemPresenter(userOrFailure);
			setStatePromise(Loaded(stateOrFailure));
		})();
	}, [params.itemId]);

	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const item = statePromiseResult.val;

	return (
		<>
			<div className="flex mb-4 gap-x-2">
				<Link
					to={item.collection.owner.link}
					className="font-medium underline text-slate-700 text"
				>
					@{item.collection.owner.username}
				</Link>
				<span>/</span>
				<Link
					to={item.collection.link}
					className="font-medium underline text-slate-700 text"
				>
					{item.collection.name}
				</Link>
				<span className="ml-auto text-slate-600">{item.createdAt}</span>
			</div>
			<div className="justify-between mt-4 mb-8 md:flex">
				<div className="mb-4 md:mb-0">
					<h1 className="mb-1 font-serif text-3xl font-bold text-slate-800">
						{item.name}
					</h1>
					<p className="flex flex-wrap items-center gap-2 text-slate-600">
						{item.tags.map((tag, index) => (
							<React.Fragment key={index}>#{tag} </React.Fragment>
						))}
					</p>
				</div>
				{item.editable && (
					<Button variant="outline" className="md:mt-1" asChild>
						<Link to={item.editLink}>
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
					<ItemFieldRows itemFields={item.fields.textFields} />
					<ItemFieldRows itemFields={item.fields.dateFields} />
					<ItemFieldRows itemFields={item.fields.numberFields} />
					<ItemFieldRows itemFields={item.fields.checkboxFields} />
				</TableBody>
			</Table>

			{item.fields.multilineTextFields.map(({ id, name, value }) => (
				<React.Fragment key={id}>
					<h3 className="mt-4 mb-2 font-semibold text-slate-700">{name}</h3>
					<p className="whitespace-pre-wrap">{value}</p>
				</React.Fragment>
			))}

			<h2 className="mt-8 mb-4 font-semibold text-slate-700">Comments</h2>
			<Comments
				itemId={item.id}
				comments={item.comments}
				addComment={(comment) => {
					const itemCopy = structuredClone(item);
					itemCopy.comments.unshift(comment);
					setStatePromise(Loaded(Ok(itemCopy)));
				}}
				removeComment={(commentId) => {
					const itemCopy = structuredClone(item);
					const index = item.comments.findIndex((c) => c.id === commentId);
					itemCopy.comments.splice(index, 1);
					setStatePromise(Loaded(Ok(itemCopy)));
				}}
			/>
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
	itemId: string;
	comments: UiComment[];
	addComment: (uiComment: UiComment) => void;
	removeComment: (commentId: string) => void;
}) {
	const [commentText, setCommentText] = useState("");
	const createComment = useContext(CreateCommentUseCaseContext);

	return (
		<>
			<form
				className="max-w-screen-sm"
				onSubmit={async (e) => {
					e.preventDefault();
					const result = await createComment.execute({
						itemId: props.itemId,
						text: commentText,
					});
					if (result.err) {
						console.error(result);
						throw new Error("Not implemented");
					}
					const comment = result.val;
					const uiComment = uiCommentPresenter(comment);
					props.addComment(uiComment);
					setCommentText("");
				}}
			>
				<Textarea
					required
					placeholder="Type your comment here"
					onChange={(e) => setCommentText(e.target.value)}
					value={commentText}
				/>
				<Button className="block mt-2 ml-auto">New comment</Button>
			</form>

			<ul className="py-2 space-y-6 list-none list-inside">
				{props.comments.map((comment) => (
					<li key={comment.id} className="rounded-md">
						<div className="mb-1 text-sm">
							<Message className="inline-block mr-1 text-slate-500" />
							<Link to={comment.author.link} className="font-bold">
								@{comment.author.username}
							</Link>
							<span className="inline-block ml-2 lowercase text-slate-700">
								{comment.createdAt}
							</span>
							{comment.editable && (
								<Button
									variant="link"
									className="float"
									onClick={async () => {
										await httpDeleteCommentService(comment.id);
										props.removeComment(comment.id);
									}}
								>
									delete
								</Button>
							)}
						</div>
						<p className="p-1">{comment.text}</p>
					</li>
				))}
			</ul>
		</>
	);
}
