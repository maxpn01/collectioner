import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext } from "react";
import { Ok } from "ts-results";

import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/checkbox";
import { Button } from "@/components/button";
import { UserTable } from "./user-table";
import { httpSetUserBlockedService, httpSetUserIsAdminService } from ".";
import { Signal, signal, useComputed } from "@preact/signals-react";

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
};

const DashboardPageStateContext = createContext<
	StatePromise<DashboardPageState>
>(
	Loaded(
		Ok({
			users: [
				{
					id: "john",
					username: "john",
					email: "john@example.com",
					fullname: "John",
					blocked: signal(false),
					isAdmin: signal(false),
				},
				{
					id: "tyler",
					username: "tyler",
					email: "tyler@example.com",
					fullname: "Tyler",
					blocked: signal(false),
					isAdmin: signal(true),
				},
			],
		}),
	),
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

export const dashboardPageRoute = "/dashboard" as const;
export function DashboardPage() {
	const statePromise = useContext(DashboardPageStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const state = statePromiseResult.val;

	return (
		<>
			<h1 className="mb-8 text-lg font-semibold text-slate-700">
				Admin Dashboard
			</h1>
			<UserTable columns={userTableColumns} data={state.users} />
			<h3 className="mt-8 mb-4 font-semibold text-slate-700">Danger zone</h3>
			<Button
				variant="outline"
				className="text-red-500 border-red-500 hover:text-red-500 hover:bg-red-50"
			>
				Give up admin privileges
			</Button>
		</>
	);
}
