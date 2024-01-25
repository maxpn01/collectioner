import {
	ErrorIndicator,
	Loaded,
	Loading,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext, useEffect, useState } from "react";
import { Ok, Result } from "ts-results";

import { ColumnDef } from "@tanstack/react-table";

import { DangerButton } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Failure } from "@/utils/failure";
import { Signal, signal, useComputed } from "@preact/signals-react";
import { httpSetUserBlockedService, httpSetUserIsAdminService } from ".";
import { UserTable } from "./user-table";

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
	new ViewDashboardUseCase(dummyViewDashboardService),
);

export const userTableColumns: ColumnDef<DashboardPageUser>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				className="flex"
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				className="flex"
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "username",
		header: "Username",
	},
	{
		accessorKey: "fullname",
		header: "Fullname",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "blocked",
		header: "Blocked",
		cell: ({ row }) => {
			const user = row.original;

			return useComputed(() => (
				<Checkbox
					checked={user.blocked.value}
					className="flex"
					onClick={async () => {
						const toggled = !user.blocked.value;
						const result = await httpSetUserBlockedService(user.id, toggled);
						if (result.err) throw new Error("Not implemented");
						user.blocked.value = toggled;
					}}
				/>
			));
		},
	},
	{
		accessorKey: "isAdmin",
		header: "Admin",
		cell: ({ row }) => {
			const user = row.original;

			return useComputed(() => (
				<Checkbox
					checked={user.isAdmin.value}
					className="flex"
					onClick={async () => {
						const toggled = !user.isAdmin.value;
						const result = await httpSetUserIsAdminService(user.id, toggled);
						if (result.err) throw new Error("Not implemented");
						user.isAdmin.value = toggled;
					}}
				/>
			));
		},
	},
];

type DashboardPageUser = {
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
	const viewDashboard = useContext(ViewDashboardContext);
	const [statePromise, setStatePromise] =
		useState<StatePromise<DashboardPageState>>(Loading);
	const [pageN, setPageN] = useState(1);

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
				columns={userTableColumns}
				data={state.users}
				pageN={pageN}
				setPageN={setPageN}
				lastPageN={state.lastPageN}
			/>
			<h3 className="mt-8 mb-4 font-semibold text-slate-700">Danger zone</h3>
			<DangerButton
				dialog={{
					title: "Give up admin privileges",
					body: "Are you sure you want to give up your admin privileges?",
					okButton: {
						label: "Give up privileges",
						onClick: () => {},
					},
				}}
			>
				Give up admin privileges
			</DangerButton>
		</>
	);
}
