import { Failure } from "@/utils/failure";
import { EditPencil, MultiplePages, Page, Plus } from "iconoir-react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Err, None, Ok, Option, Result } from "ts-results";
import { Button } from "../components/button";
import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "../utils/state-promise";
import env from "@/env";
import { userLinkPresenter } from "@/user";
import { CollectionFieldType, collectionLinkPresenter } from ".";
import { AuthenticatedUserRepository, localStorageAuthenticatedUserRepository } from "@/user/auth";

type Item = {
	id: string;
	name: string;
	tags: string[];
	createdAt: string;
};

type CollectionField = {
	id: string;
	name: string;
	type: CollectionFieldType;
};

type Collection = {
	editable: boolean;
	id: string;
	name: string;
	imageOption: Option<string>;
	size: number;
	owner: {
		id: string;
		username: string;
		fullname: string;
	};
	topic: {
		id: string;
		name: string;
	};
	fields: CollectionField[];
	items: Item[];
};

type ViewCollectionService = (
	id: string,
) => Promise<Result<Collection, Failure>>;

const httpViewCollectionService: ViewCollectionService = async (id) => {
	const res = await fetch(
		`${env.backendApiBase}/collection?id=${id}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	if (!res.ok) return Err(new Failure());
	const json = await res.json();

	return Ok(json);
};

export type ViewCollectionResponse = {
	editable: boolean;
	id: string;
	name: string;
	imageOption: Option<string>;
	size: number;
	owner: {
		id: string;
		username: string;
		fullname: string;
	};
	topic: {
		id: string;
		name: string;
	};
	fields: CollectionField[];
	items: Item[];
};

export class ViewCollectionUseCase {
	viewCollection: ViewCollectionService;
	repo: AuthenticatedUserRepository;

	constructor(viewCollection: ViewCollectionService, repo: AuthenticatedUserRepository) {
		this.viewCollection = viewCollection;
		this.repo = repo;
	}

	async execute(id: string): Promise<Result<ViewCollectionResponse, Failure>> {
		const collectionResult = await this.viewCollection(id);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		 let editable = false;
		 const authenticatedUserResult = this.repo.get();
		if (authenticatedUserResult.some) {
			const authenticatedUser = authenticatedUserResult.val;
			editable = collection.owner.id === authenticatedUser.id || authenticatedUser.isAdmin;
		}

		return Ok({
			...collection,
			editable,
		});
	}
}

const dummyViewCollectionService: ViewCollectionService = async (id: string) => {
	return Ok({
		id,
		editable: true,
		name: "My favourite books",
		imageOption: None,
		size: 17,
		owner: {
			id: "john",
			fullname: "John",
			username: "john",
		},
		topic: {
			id: "books",
			name: "Books",
		},
		fields: [],
		items: [
			{
				id: "lordoftherings",
				name: "The Lord of the Rings",
				tags: ["fantasy", "epic"],
				createdAt: "Today",
			},
			{
				id: "gameofthrones",
				name: "A Game of Thrones",
				tags: ["fantasy", "adventure"],
				createdAt: "Today",
			},
			{
				id: "tokillamockingbird",
				name: "To Kill a Mockingbird",
				tags: ["classic", "literary fiction"],
				createdAt: "Today",
			},
			{
				id: "prideandprejudice",
				name: "Pride and Prejudice",
				tags: ["classic", "romance"],
				createdAt: "Today",
			},
			{
				id: "thegreatgatsby",
				name: "The Great Gatsby",
				tags: ["classic", "tragedy"],
				createdAt: "Today",
			},
			{
				id: "thecatcherintheRY",
				name: "The Catcher in the Rye",
				tags: ["classic", "coming-of-age"],
				createdAt: "Today",
			},
			{
				id: "thehobbit",
				name: "The Hobbit",
				tags: ["fantasy", "adventure"],
				createdAt: "Today",
			},
			{
				id: "thepictureofdoriangray",
				name: "The Picture of Dorian Gray",
				tags: ["classic", "horror"],
				createdAt: "Today",
			},
			{
				id: "1984",
				name: "1984",
				tags: ["dystopia", "science fiction"],
				createdAt: "Today",
			},
			{
				id: "animalfarm",
				name: "Animal Farm",
				tags: ["allegory", "political satire"],
				createdAt: "Today",
			},
		],
	});
}

export const ViewCollectionContext = createContext(
	new ViewCollectionUseCase(httpViewCollectionService, localStorageAuthenticatedUserRepository),
);

function collectionPageStatePresenter(
	collection: ViewCollectionResponse,
): CollectionPageState {
	const ownerLink = userLinkPresenter(collection.owner.username);
	const collectionLink = collectionLinkPresenter(collection.id, ownerLink);
	const itemsWithLinks = collection.items.map((item) => ({
		...item,
		link: `${collectionLink}/items/${item.id}`,
	}));

	return {
		...collection,
		editLink: `${collectionLink}/edit`,
		newItemLink: `${collectionLink}/new-item`,
		owner: {
			...collection.owner,
			link: ownerLink,
		},
		items: itemsWithLinks,
	};
}

type CollectionPageItem = {
	id: string;
	name: string;
	tags: string[];
	createdAt: string;
	link: string;
};

type CollectionPageState = {
	editable: boolean;
	id: string;
	editLink: string;
	newItemLink: string;
	name: string;
	imageOption: Option<string>;
	size: number;
	owner: {
		id: string;
		username: string;
		fullname: string;
		link: string;
	};
	topic: {
		id: string;
		name: string;
	};
	items: CollectionPageItem[];
};

export function CollectionTopic(props: { name: string }) {
	return (
		<div className="flex items-center leading-none text-slate-500">
			<div title="Topic" className="flex items-end mr-2 text-xs">
				<MultiplePages />
			</div>
			<span className="align-text-bottom text-slate-800">{props.name}</span>
		</div>
	);
}

export function CollectionPage() {
	const viewCollection = useContext(ViewCollectionContext);
	const [collectionPromise, setCollectionPromise] =
		useState<StatePromise<CollectionPageState>>(Loading);

	const params = useParams();

	useEffect(() => {
		(async () => {
			const collectionId = params.collectionId;
			if (!collectionId) {
				console.error("Collection ID not specified");
				setCollectionPromise(Loaded(Err(new Failure())));
				return;
			}

			const result = await viewCollection.execute(collectionId);
			if (result.err) {
				console.error(result.val);
				setCollectionPromise(Loaded(result));
				return;
			}
			const response = result.val;

			const state = collectionPageStatePresenter(response);
			setCollectionPromise(Loaded(Ok(state)));
		})();
	}, [params.collectionId, viewCollection]);

	if (collectionPromise.loading) return <LoadingIndicator />;
	const result = collectionPromise.val;
	if (result.err) return <ErrorIndicator />;
	const collection = result.val;

	return (
		<>
			<CollectionHeader collection={collection} />

			<ItemsList
				editable={collection.editable}
				items={collection.items}
				newItemLink={collection.newItemLink}
			/>
		</>
	);
}

function CollectionHeader({ collection }: { collection: CollectionPageState }) {
	return (
		<div className="mb-4">
			<Link
				to={collection.owner.link}
				className="font-medium underline text-slate-700 text"
			>
				@{collection.owner.username}
			</Link>
			<div className="flex items-end justify-between">
				<h1 className="mb-2 text-xl font-bold leading-tight text-slate-700">
					{collection.name}{" "}
					<span className="text-base font-normal text-slate-600">
						({collection.size})
					</span>
				</h1>

				{collection.editable && (
					<EditCollectionButton editLink={collection.editLink} />
				)}
			</div>
			<CollectionTopic name={collection.topic.name} />
		</div>
	);
}

function EditCollectionButton({ editLink }: { editLink: string }) {
	return (
		<Button asChild variant="outline" withIcon size="sm" className="mt-2">
			<Link to={editLink}>
				<EditPencil className="mr-2" />
				Edit
			</Link>
		</Button>
	);
}

export function ItemsList({
	editable,
	newItemLink,
	items,
}: {
	editable: boolean;
	newItemLink: string;
	items: CollectionPageItem[];
}) {
	return (
		<>
			<div className="flex items-end justify-between mt-8 mb-4">
				<h2 className="font-semibold text-slate-700">Items</h2>
				{editable && (
					<Button withIcon size="sm" asChild>
						<Link to={newItemLink}>
							<Plus className="mr-2" />
							New item
						</Link>
					</Button>
				)}
			</div>
			<ul className="divide-y divide-slate-200">
				{items.map((item) => (
					<ItemsListTile key={item.id} item={item} />
				))}
			</ul>
		</>
	);
}

export function ItemsListTile({ item }: { item: CollectionPageItem }) {
	return (
		<li className="flex items-start py-4">
			<div title="Item" className="flex items-end mr-2 text-xs">
				<Page />
			</div>
			<div className="space-y-2">
				<h3 className="flex text-lg font-semibold leading-none text-slate-800">
					<Link to={item.link}>{item.name}</Link>
				</h3>

				<p className="text-sm text-slate-700">
					{item.tags.map((tag, index) => (
						<React.Fragment key={index}>#{tag} </React.Fragment>
					))}
				</p>
			</div>
			<span className="block ml-auto text-sm text-slate-700">
				{item.createdAt}
			</span>
		</li>
	);
}

export type TopicsState = {
	id: string;
	name: string;
}[];

export const TopicsStateContext = createContext<StatePromise<TopicsState>>(
	Loaded(
		Ok([
			{
				id: "topic_books",
				name: "Books",
			},
			{
				id: "topic_coins",
				name: "Coins",
			},
			{
				id: "topic_art",
				name: "Art",
			},
		]),
	),
);
