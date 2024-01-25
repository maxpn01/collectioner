import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext, useEffect, useState } from "react";
import { Err, Ok, Result, Some } from "ts-results";

import { ColumnDef } from "@tanstack/react-table";

import { DangerButton } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Failure } from "@/utils/failure";
import { Signal, signal, useComputed } from "@preact/signals-react";
import { UserTable } from "./user-table";
import { UserBlockedSetManyContext, UserIsAdminSetManyContext } from ".";
import env from "@/env";
import {
	authenticatedUserState,
	localStorageAuthenticatedUserRepository,
} from "@/user/auth";
import { homePageRoute } from "@/home";
import { useNavigate } from "react-router-dom";

type ViewDashboardService = (
	pageN: number,
	size: number,
) => Promise<Result<Dashboard, Failure>>;

type Dashboard = {
	page: {
		id: string;
		username: string;
		email: string;
		fullname: string;
		blocked: boolean;
		isAdmin: boolean;
	}[];
	lastPage: number;
};

class ViewDashboardUseCase {
	viewDashboard: ViewDashboardService;

	constructor(viewDashboard: ViewDashboardService) {
		this.execute = this.execute.bind(this);
		this.viewDashboard = viewDashboard;
	}

	async execute(
		pageN: number,
		size: number,
	): Promise<Result<Dashboard, Failure>> {
		return this.viewDashboard(pageN, size);
	}
}

const dummyViewDashboardService: ViewDashboardService = async (
	pageN: number,
) => {
	return Ok({
		page: [
			{
				id: "john",
				username: "john from page " + pageN,
				email: "john@example.com",
				fullname: "John",
				blocked: false,
				isAdmin: false,
			},
			{
				id: "tyler",
				username: "tyler",
				email: "tyler@example.com",
				fullname: "Tyler",
				blocked: false,
				isAdmin: true,
			},
			{
				id: "john",
				username: "john",
				email: "john@example.com",
				fullname: "John",
				blocked: false,
				isAdmin: false,
			},
			{
				id: "tyler",
				username: "tyler",
				email: "tyler@example.com",
				fullname: "Tyler",
				blocked: false,
				isAdmin: true,
			},
		],
		lastPage: 50,
	});
};

const httpViewDashboardService: ViewDashboardService = async (
	pageN: number,
	size: number,
) => {
	const res = await fetch(
		`${env.backendApiBase}/users?pageN=${pageN}&size=${size}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		},
	);
	if (!res.ok) return Err(new Failure());
	const json = await res.json();

	return Ok(json);
};

function dashboardPresenter(dashboard: Dashboard): DashboardPageState {
	return {
		users: dashboard.page.map((user) => {
			return {
				...user,
				blocked: signal(user.blocked),
				isAdmin: signal(user.isAdmin),
			};
		}),
		lastPageN: dashboard.lastPage,
	};
}

export const ViewDashboardContext = createContext(
	new ViewDashboardUseCase(
		env.isProduction ? httpViewDashboardService : httpViewDashboardService,
	),
);

export type DashboardPageUser = {
	id: string;
	username: string;
	email: string;
	fullname: string;
	blocked: Signal<boolean>;
	isAdmin: Signal<boolean>;
};
type DashboardPageState = {
	users: DashboardPageUser[];
	lastPageN: number;
};

export const dashboardPageRoute = "/dashboard" as const;
export function DashboardPage() {
	const navigate = useNavigate();
	const viewDashboard = useContext(ViewDashboardContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<DashboardPageState>>(Loading);
	const [pageN, setPageN] = useState(1);
	const userIsAdminSetMany = useContext(UserIsAdminSetManyContext);

	useEffect(() => {
		(async () => {
			setStatePromise(Loading);
			const result = await viewDashboard.execute(pageN, 50);
			if (result.err) {
				console.error(result);
				setStatePromise(Loaded(result));
				return;
			}
			const dashboard = result.val;
			const state = dashboardPresenter(dashboard);
			setStatePromise(Loaded(Ok(state)));
		})();
	}, [pageN]);

	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const state = statePromiseResult.val;

	return (
		<>
			<h1 className="mb-8 text-lg font-semibold text-slate-700">
				Admin Dashboard
			</h1>
			<UserTable
				data={state.users}
				pageN={pageN}
				setPageN={setPageN}
				lastPageN={state.lastPageN}
				refreshData={async () => {
					setStatePromise(Loading);
					const result = await viewDashboard.execute(pageN, 50);
					if (result.err) {
						console.error(result);
						setStatePromise(Loaded(result));
						return;
					}
					const dashboard = result.val;
					const state = dashboardPresenter(dashboard);
					setStatePromise(Loaded(Ok(state)));
				}}
			/>
			<h3 className="mt-8 mb-4 font-semibold text-slate-700">Danger zone</h3>
			<DangerButton
				dialog={{
					title: "Give up admin privileges",
					body: "Are you sure you want to give up your admin privileges?",
					okButton: {
						label: "Give up privileges",
						onClick: async () => {
							const authenticatedUserOption = authenticatedUserState.value;
							if (authenticatedUserOption.none)
								throw new Error("Admin is not authenticated");
							const authenticatedUser = authenticatedUserOption.val;

							const result = await userIsAdminSetMany.execute(
								[authenticatedUser.id],
								false,
							);
							if (result.err) {
								console.error(result);
								return;
							}

							const updatedAuthenticatedUser =
								structuredClone(authenticatedUser);
							updatedAuthenticatedUser.isAdmin = false;

							localStorageAuthenticatedUserRepository.set(
								Some(updatedAuthenticatedUser),
							);
							authenticatedUserState.value = Some(updatedAuthenticatedUser);

							navigate(homePageRoute);
						},
					},
				}}
			>
				Give up admin privileges
			</DangerButton>
		</>
	);
}
