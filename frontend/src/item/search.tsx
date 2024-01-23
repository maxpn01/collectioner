import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { Page } from "iconoir-react";
import React, { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { Ok } from "ts-results";
import { itemPageRoute } from "./view-item";
import { userPageRoute } from "@/user/view-user";
import { collectionPageRoute } from "@/collection/view-collection";

type SearchPageItem = {
	id: string;
	name: string;
	tags: string[];
	collection: {
		id: string;
		name: string;
		owner: {
			id: string;
			username: string;
		};
	};
	createdAt: string;
};

type SearchPageState = {
	items: SearchPageItem[];
};

const SearchPageStateContext = createContext<StatePromise<SearchPageState>>(
	Loaded(
		Ok({
			items: [
				{
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
				},
				{
					id: "gameofthrones",
					name: "A Game of Thrones",
					tags: ["fantasy", "adventure"],
					createdAt: "Today",
					collection: {
						id: "myfavouritebooks",
						name: "My favourite books",
						owner: {
							id: "john",
							username: "john",
						},
					},
				},
				{
					id: "tokillamockingbird",
					name: "To Kill a Mockingbird",
					tags: ["classic", "literary fiction"],
					createdAt: "Today",
					collection: {
						id: "myfavouritebooks",
						name: "My favourite books",
						owner: {
							id: "john",
							username: "john",
						},
					},
				},
			],
		}),
	),
);

export const searchPageRoute = "/search" as const;
export function SearchPage() {
	const statePromise = useContext(SearchPageStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const state = statePromiseResult.val;

	return <ItemList items={state.items} />;
}

export function ItemList({ items }: { items: SearchPageItem[] }) {
	return (
		<>
			<div className="flex items-end justify-between mb-4">
				<h1 className="font-semibold text-slate-700">Search results</h1>
			</div>
			<ul className="divide-y divide-slate-200">
				{items.map((item) => (
					<ItemsListTile key={item.id} item={item} />
				))}
			</ul>
		</>
	);
}

export function ItemsListTile({ item }: { item: SearchPageItem }) {
	return (
		<li className="flex items-start py-4">
			<div title="Item" className="flex items-end mr-2 text-xs">
				<Page />
			</div>
			<div className="space-y-2">
				<h3 className="flex text-lg font-semibold leading-none text-slate-800">
					<Link to={itemPageRoute}>{item.name}</Link>
				</h3>

				<div className="text-sm">
					<Link
						to={userPageRoute}
						className="font-medium underline text-slate-700"
					>
						@{item.collection.owner.username}
					</Link>
					<span className="mx-2">/</span>
					<Link
						to={collectionPageRoute}
						className="font-medium underline text-slate-700"
					>
						{item.collection.name}
					</Link>
				</div>

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
