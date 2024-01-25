import { Failure } from "@/utils/failure";
import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { Page } from "iconoir-react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Err, Ok, Result } from "ts-results";
import { itemLinkPresenter } from ".";
import { collectionLinkPresenter } from "@/collection";
import { userLinkPresenter } from "@/user";
import { formatDateRelative } from "@/utils/date";

type Item = {
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
	createdAt: Date;
};

type SearchService = (q: string) => Promise<Result<Item[], Failure>>;

class SearchUseCase {
	search: SearchService;

	constructor(search: SearchService) {
		this.execute = this.execute.bind(this);
		this.search = search;
	}

	async execute(q: string): Promise<Result<Item[], Failure>> {
		return this.search(q);
	}
}

function searchPageStatePresenter(items: Item[]): SearchPageState {
	return {
		items: items.map(uiItemFrom),
	};
}

function uiItemFrom(item: Item): SearchPageItem {
	const ownerLink = userLinkPresenter(item.collection.owner.username);
	const collectionLink = collectionLinkPresenter(item.collection.id, ownerLink);

	return {
		id: item.id,
		name: item.name,
		tags: item.tags,
		link: itemLinkPresenter(item.id, collectionLink),
		collection: {
			...item.collection,
			link: collectionLink,
			owner: {
				...item.collection.owner,
				link: ownerLink,
			},
		},
		createdAt: formatDateRelative(item.createdAt),
	};
}

type SearchPageItem = {
	id: string;
	name: string;
	tags: string[];
	link: string;
	collection: {
		id: string;
		link: string;
		name: string;
		owner: {
			id: string;
			link: string;
			username: string;
		};
	};
	createdAt: string;
};

type SearchPageState = {
	items: SearchPageItem[];
};

const SearchContext = createContext(
	new SearchUseCase(async () =>
		Ok([
			{
				id: "lordoftherings",
				name: "The Lord of the Rings",
				tags: ["fantasy", "epic"],
				createdAt: new Date("2024-01-20T12:12:12"),
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
				createdAt: new Date(),
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
				createdAt: new Date(),
				collection: {
					id: "myfavouritebooks",
					name: "My favourite books",
					owner: {
						id: "john",
						username: "john",
					},
				},
			},
		]),
	),
);

export const searchPageRoute = "/search" as const;
export function SearchPage() {
	const location = useLocation();
	const search = useContext(SearchContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<SearchPageState>>(Loading);

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const query = queryParams.get("q");
		if (!query) {
			console.error("No query");
			setStatePromise(Loaded(Err(new Failure())));
			return;
		}

		(async () => {
			const result = await search.execute(query);
			if (result.err) {
				console.error(result);
				setStatePromise(Loaded(result));
				return;
			}
			const items = result.val;
			const state = searchPageStatePresenter(items);

			setStatePromise(Loaded(Ok(state)));
		})();
	}, [location.search]);

	if (statePromise.loading) return <LoadingIndicator />;
	const stateResult = statePromise.val;
	if (stateResult.err) return <ErrorIndicator />;
	const state = stateResult.val;

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
					<Link to={item.link}>{item.name}</Link>
				</h3>

				<div className="text-sm">
					<Link
						to={item.collection.owner.link}
						className="font-medium underline text-slate-700"
					>
						@{item.collection.owner.username}
					</Link>
					<span className="mx-2">/</span>
					<Link
						to={item.collection.link}
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
