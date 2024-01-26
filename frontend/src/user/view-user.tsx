import { NewCollectionButton } from "@/collection/create-collection";
import { Failure } from "@/utils/failure";
import { createContext, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Err, Ok, Option, Result } from "ts-results";
import { CollectionTopic } from "../collection/view-collection";
import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "../utils/state-promise";
import env from "@/env";
import { userLinkPresenter } from ".";
import { collectionLinkPresenter } from "@/collection";
import {
	AuthenticatedUserRepository,
	localStorageAuthenticatedUserRepository,
} from "./auth";
import { BlockedUserSvg } from "./blocked-user-svg";

type User = {
	id: string;
	username: string;
	fullname: string;
	collections: Collection[];
	blocked: false;
};

type BlockedUser = {
	username: string;
	blocked: true;
};

type Collection = {
	id: string;
	name: string;
	topic: {
		id: string;
		name: string;
	};
	imageOption: Option<string>;
	size: number;
};

type ViewUserService = (
	username: string,
) => Promise<Result<User | BlockedUser, Failure>>;

const httpViewUserService: ViewUserService = async (
	username: string,
): Promise<Result<User | BlockedUser, Failure>> => {
	const res = await fetch(
		`${env.backendUrlBase}/api/user?username=${username}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	if (!res.ok) return Err(new Failure());
	const json = await res.json();

	if (json.blocked) return Ok({ username, blocked: true });

	return Ok(json);
};

type ViewUserResponse =
	| {
			id: string;
			username: string;
			editable: boolean;
			fullname: string;
			collections: {
				id: string;
				name: string;
				topic: {
					id: string;
					name: string;
				};
				imageOption: Option<string>;
				size: number;
			}[];
			blocked: false;
	  }
	| {
			username: string;
			blocked: true;
	  };

class ViewUserUseCase {
	viewUser: ViewUserService;
	repo: AuthenticatedUserRepository;

	constructor(viewUser: ViewUserService, repo: AuthenticatedUserRepository) {
		this.execute = this.execute.bind(this);
		this.viewUser = viewUser;
		this.repo = repo;
	}

	async execute(username: string): Promise<Result<ViewUserResponse, Failure>> {
		const viewUserResult = await this.viewUser(username);
		if (viewUserResult.err) return viewUserResult;
		const user = viewUserResult.val;

		if (user.blocked) return Ok(user);

		let editable = false;
		const authenticatedUserOption = this.repo.get();
		if (authenticatedUserOption.some) {
			const authenticatedUser = authenticatedUserOption.val;

			editable = user.id === authenticatedUser.id || authenticatedUser.isAdmin;
		}

		const response: ViewUserResponse = {
			...user,
			editable,
		};

		return Ok(response);
	}
}

function userPageStatePresenter(user: ViewUserResponse): UserPageState {
	if (user.blocked) return user;

	return {
		...user,
		collections: user.collections.map((collection) => {
			return {
				...collection,
				link: collectionLinkPresenter(
					collection.id,
					userLinkPresenter(user.username),
				),
			};
		}),
	};
}

type UserPageCollection = {
	id: string;
	name: string;
	link: string;
	topic: {
		id: string;
		name: string;
	};
	imageOption: Option<string>;
	size: number;
};

type UserPageState =
	| {
			id: string;
			username: string;
			fullname: string;
			collections: UserPageCollection[];
			editable: boolean;
			blocked: false;
	  }
	| { username: string; blocked: true };

// const dummyViewUserService: ViewUserService = async (username: string) => {
// 	return Ok({
// 		username,
// 		blocked: true,
// 		id: "john",
// 		fullname: "John",
// 		collections: [
// 			{
// 				id: "favbooks",
// 				name: "My favourite books",
// 				topic: {
// 					id: "books",
// 					name: "Books",
// 				},
// 				imageOption: None,
// 				size: 17,
// 			},
// 			{
// 				id: "coins",
// 				name: "Coins Wiki",
// 				topic: {
// 					id: "coins",
// 					name: "Coins",
// 				},
// 				imageOption: None,
// 				size: 24,
// 			},
// 			{
// 				id: "paintings",
// 				name: "Classic Paintings",
// 				topic: {
// 					id: "art",
// 					name: "Art",
// 				},
// 				imageOption: None,
// 				size: 11,
// 			},
// 		],
// 	});
// };

const ViewUserContext = createContext<ViewUserUseCase>(
	new ViewUserUseCase(
		env.isProduction ? httpViewUserService : httpViewUserService,
		localStorageAuthenticatedUserRepository,
	),
);

export function UserPage() {
	const viewUser = useContext(ViewUserContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<UserPageState>>(Loading);

	const params = useParams();

	useEffect(() => {
		(async () => {
			const username = params.username;
			if (!username) {
				console.error("Username not specified");
				setStatePromise(Loaded(Err(new Failure())));
				return;
			}
			setStatePromise(Loading);
			const viewUserResult = await viewUser.execute(username);
			if (viewUserResult.err) {
				setStatePromise(Loaded(viewUserResult));
				return;
			}
			const response = viewUserResult.val;
			const userPageState = userPageStatePresenter(response);
			setStatePromise(Loaded(Ok(userPageState)));
		})();
	}, [params.userId]);

	if (statePromise.loading) return <LoadingIndicator />;
	const userPageResult = statePromise.val;
	if (userPageResult.err) return <ErrorIndicator />;
	const user = userPageResult.val;

	if (user.blocked) {
		return (
			<div className="flex flex-col items-center">
				<BlockedUserSvg className="w-20 h-20 text-gray-500" />@{user.username}{" "}
				is blocked.
			</div>
		);
	}

	return (
		<>
			<h1 className="mb-4 text-2xl">
				{user.fullname}{" "}
				<span className="text-xl font-normal text-slate-700">
					@{user.username}
				</span>
			</h1>

			<div className="flex items-end justify-between mt-8 mb-4">
				<h2 className="font-semibold text-slate-700">Collections</h2>
				{user.editable && <NewCollectionButton ownerId={user.id} />}
			</div>

			<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{user.collections.map((collection) => (
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
				<Link to={props.collection.link}>{props.collection.name}</Link>{" "}
				<span className="text-base font-normal text-slate-600">
					({props.collection.size})
				</span>
			</h3>

			<CollectionTopic name={props.collection.topic.name} />
		</li>
	);
}
