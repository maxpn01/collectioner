import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { createContext, useContext } from "react";
import { Ok } from "ts-results";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/table";
import { Checkbox } from "@/components/checkbox";
import { Button } from "@/components/button";

type DashboardPageUser = {
	id: string;
	username: string;
	email: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
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
		}),
	),
);

export const dashboardPageRoute = "/dashboard" as const;
export function DashboardPage() {
	const statePromise = useContext(DashboardPageStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const statePromiseResult = statePromise.val;
	if (statePromiseResult.err) return <ErrorIndicator />;
	const state = statePromiseResult.val;

	return (
		<>
			<DataTable columns={columns} data={state.users} />
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

export const columns: ColumnDef<DashboardPageUser>[] = [
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
			const blocked: boolean = row.getValue("blocked");

			return <Checkbox checked={blocked} />;
		},
	},
	{
		accessorKey: "isAdmin",
		header: "Admin",
		cell: ({ row }) => {
			const isAdmin: boolean = row.getValue("isAdmin");

			return <Checkbox checked={isAdmin} />;
		},
	},
];

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div>
			<div className="border rounded-md">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end py-4 space-x-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
