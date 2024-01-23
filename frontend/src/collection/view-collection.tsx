import { createItemPageRoute } from "@/item/create-item";
import { itemPageRoute } from "@/item/view-item";
import { userPageRoute } from "@/user/view-user";
import { EditPencil, MultiplePages, Page, Plus } from "iconoir-react";
import React, { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { None, Ok, Option } from "ts-results";
import { Button } from "../components/button";
import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "../utils/state-promise";
import { editCollectionPageRoute } from "./edit-collection";

type CollectionPageItem = {
	id: string;
	name: string;
	tags: string[];
	createdAt: string;
};

type CollectionPageState = {
	editable: boolean;
	id: string;
	name: string;
	imageOption: Option<string>;
	itemCount: number;
	owner: {
		id: string;
		username: string;
		fullname: string;
	};
	topic: {
		id: string;
		name: string;
	};
	items: CollectionPageItem[];
};

const CollectionPageStateContext = createContext<
	StatePromise<CollectionPageState>
>(
	Loaded(
		Ok({
			editable: true,
			id: "favbooks",
			name: "My favourite books",
			imageOption: None,
			itemCount: 17,
			owner: {
				id: "john",
				fullname: "John",
				username: "john",
			},
			topic: {
				id: "books",
				name: "Books",
			},
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
		}),
	),
);

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

export const collectionPageRoute = "/collection" as const;
export function CollectionPage() {
	const statePromise = useContext(CollectionPageStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const state = statePromiseResult.val;

	return (
		<>
			<CollectionHeader state={state} />

			<ItemsList editable={state.editable} items={state.items} />
		</>
	);
}

function CollectionHeader({ state }: { state: CollectionPageState }) {
	return (
		<div className="mb-4">
			<Link
				to={userPageRoute}
				className="font-medium underline text-slate-700 text"
			>
				@{state.owner.username}
			</Link>
			<div className="flex items-end justify-between">
				<h1 className="mb-2 text-xl font-bold leading-tight text-slate-700">
					{state.name}{" "}
					<span className="text-base font-normal text-slate-600">
						({state.itemCount})
					</span>
				</h1>

				{state.editable && <EditCollectionButton />}
			</div>
			<CollectionTopic name={state.topic.name} />
		</div>
	);
}

function EditCollectionButton() {
	return (
		<Button asChild variant="outline" withIcon size="sm" className="mt-2">
			<Link to={editCollectionPageRoute}>
				<EditPencil className="mr-2" />
				Edit
			</Link>
		</Button>
	);
}

type CollectionListProps = {
	editable: boolean;
	items: {
		id: string;
		name: string;
		tags: string[];
		createdAt: string;
	}[];
};

export const ItemsList: React.FC<CollectionListProps> = ({
	editable,
	items,
}) => {
	return (
		<>
			<div className="flex items-end justify-between mt-8 mb-4">
				<h2 className="font-semibold text-slate-700">Items</h2>
				{editable && (
					<Button asChild withIcon size="sm">
						<Link to={createItemPageRoute}>
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
};

type CollectionItemProps = {
	item: {
		id: string;
		name: string;
		tags: string[];
		createdAt: string;
	};
};

export const ItemsListTile: React.FC<CollectionItemProps> = ({ item }) => {
	return (
		<li className="flex items-start py-4">
			<div title="Item" className="flex items-end mr-2 text-xs">
				<Page />
			</div>
			<div className="space-y-2">
				<h3 className="flex text-lg font-semibold leading-none text-slate-800">
					<Link to={itemPageRoute}>{item.name}</Link>
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
};

export type TopicsState = {
	id: string;
	name: string;
}[];

export const TopicsStateContext = createContext<StatePromise<TopicsState>>(
	Loaded(
		Ok([
			{
				id: "books",
				name: "Books",
			},
			{
				id: "coins",
				name: "Coins",
			},
			{
				id: "art",
				name: "Art",
			},
		]),
	),
);
