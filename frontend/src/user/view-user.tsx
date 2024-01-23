import { NewCollectionButton } from "@/collection/create-collection";
import { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { None, Ok, Option } from "ts-results";
import {
	collectionPageRoute,
	CollectionTopic,
} from "../collection/view-collection";
import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "../utils/state-promise";

type UserPageCollection = {
	id: string;
	name: string;
	topic: {
		id: string;
		name: string;
	};
	imageOption: Option<string>;
	itemCount: number;
};

type UserPageState = {
	id: string;
	username: string;
	fullname: string;
	collections: UserPageCollection[];
	editable: boolean;
};

const UserPageStateContext = createContext<StatePromise<UserPageState>>(
	Loaded(
		Ok({
			id: "john",
			username: "john",
			fullname: "John",
			editable: true,
			collections: [
				{
					id: "favbooks",
					name: "My favourite books",
					topic: {
						id: "books",
						name: "Books",
					},
					imageOption: None,
					itemCount: 17,
				},
				{
					id: "coins",
					name: "Coins Wiki",
					topic: {
						id: "coins",
						name: "Coins",
					},
					imageOption: None,
					itemCount: 24,
				},
				{
					id: "paintings",
					name: "Classic Paintings",
					topic: {
						id: "art",
						name: "Art",
					},
					imageOption: None,
					itemCount: 11,
				},
			],
		}),
	),
);

export const userPageRoute = "/user" as const;
export function UserPage() {
	const userPagePromise = useContext(UserPageStateContext);
	if (userPagePromise.loading) return <LoadingIndicator />;
	const userPageResult = userPagePromise.val;
	if (userPageResult.err) return <ErrorIndicator />;
	const state = userPageResult.val;

	return (
		<>
			<h1 className="mb-4 text-2xl">
				{state.fullname}{" "}
				<span className="text-xl font-normal text-slate-700">
					@{state.username}
				</span>
			</h1>

			<div className="flex items-end justify-between mt-8 mb-4">
				<h2 className="font-semibold text-slate-700">Collections</h2>
				{state.editable && <NewCollectionButton />}
			</div>

			<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{state.collections.map((collection) => (
					<CollectionTile key={collection.id} collection={collection} />
				))}
			</ul>
		</>
	);
}

function CollectionTile(props: { collection: UserPageCollection }) {
	return (
		<li className="p-4 border rounded-md">
			{props.collection.imageOption.some && (
				<img
					src={props.collection.imageOption.val}
					alt={props.collection.name}
					className="object-cover w-full h-32 mb-2 rounded-md"
				/>
			)}

			<h3 className="mb-2 font-semibold">
				<Link to={collectionPageRoute}>{props.collection.name}</Link>{" "}
				<span className="text-base font-normal text-slate-600">
					({props.collection.itemCount})
				</span>
			</h3>

			<CollectionTopic name={props.collection.topic.name} />
		</li>
	);
}
