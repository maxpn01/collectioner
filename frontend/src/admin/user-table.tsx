import { Button, DangerButton } from "@/components/button";
import { Input } from "@/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/table";
import { cn } from "@/utils/ui";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useCallback, useContext, useState } from "react";
import { DashboardPageUser } from "./dashboard";
import {
	UserBlockedSetManyContext,
	UserDeleteManyContext,
	UserIsAdminSetManyContext,
} from ".";
import { useComputed } from "@preact/signals-react";
import { Checkbox } from "@/components/checkbox";

const columns: ColumnDef<DashboardPageUser>[] = [
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
			const userBlockedSetMany = useContext(UserBlockedSetManyContext);

			return useComputed(() => (
				<Checkbox
					checked={user.blocked.value}
					className="flex"
					onClick={async () => {
						const toggled = !user.blocked.value;
						const result = await userBlockedSetMany.execute([user.id], toggled);
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
			const userIsAdminSetMany = useContext(UserIsAdminSetManyContext);

			return useComputed(() => (
				<Checkbox
					checked={user.isAdmin.value}
					className="flex"
					onClick={async () => {
						const toggled = !user.isAdmin.value;
						const result = await userIsAdminSetMany.execute([user.id], toggled);
						if (result.err) throw new Error("Not implemented");
						user.isAdmin.value = toggled;
					}}
				/>
			));
		},
	},
];

const maxButtonsShown = 8 as const;

export function UserTable({
	data,
	pageN,
	setPageN,
	lastPageN,
	refreshData,
}: {
	data: DashboardPageUser[];
	pageN: number;
	setPageN: (n: number) => void;
	lastPageN: number;
	refreshData: () => void;
}) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const hasSelectedRows = selectedRows.length > 0;

	const userBlockedSetMany = useContext(UserBlockedSetManyContext);
	const userIsAdminSetMany = useContext(UserIsAdminSetManyContext);
	const userDeleteMany = useContext(UserDeleteManyContext);

	const paginationItems: number[] = useCallback(() => {
		const half = Math.floor(maxButtonsShown / 2);
		let pages: any[] = Array.from(
			{ length: maxButtonsShown },
			(_, i) => pageN - half + i,
		);

		return pages;
	}, [pageN, lastPageN])();

	return (
		<div>
			<div
				className={cn(
					"flex flex-col md:flex-row items-start md:items-center md:justify-between mb-2 gap-y-2",
				)}
			>
				<div>
					<span className="inline-block mr-2 text-right w-9">
						({selectedRows.length})
					</span>
					selected
				</div>
				<div className="flex flex-col items-start md:flex-row gap-y-2 gap-x-4">
					<div className="flex gap-x-2">
						<Button
							size="sm"
							variant="outline"
							className=""
							disabled={!hasSelectedRows}
							onClick={async () => {
								const users = selectedRows.map((row) => row.original);
								const userIds = users.map((user) => user.id);
								const result = await userBlockedSetMany.execute(userIds, true);
								if (result.err) throw new Error("Not implemented");

								for (const user of users) {
									user.blocked.value = true;
								}
							}}
						>
							Block
						</Button>
						<Button
							size="sm"
							variant="outline"
							className=""
							disabled={!hasSelectedRows}
							onClick={async () => {
								const users = selectedRows.map((row) => row.original);
								const userIds = users.map((user) => user.id);
								const result = await userBlockedSetMany.execute(userIds, false);
								if (result.err) throw new Error("Not implemented");

								for (const user of users) {
									user.blocked.value = false;
								}
							}}
						>
							Unblock
						</Button>
					</div>

					<div className="flex gap-x-2">
						<Button
							size="sm"
							variant="outline"
							className=""
							disabled={!hasSelectedRows}
							onClick={async () => {
								const users = selectedRows.map((row) => row.original);
								const userIds = users.map((user) => user.id);
								const result = await userIsAdminSetMany.execute(userIds, false);
								if (result.err) throw new Error("Not implemented");

								for (const user of users) {
									user.isAdmin.value = false;
								}
							}}
						>
							Revoke admin
						</Button>
						<DangerButton
							disabled={!hasSelectedRows}
							dialog={{
								title: "Grant admin",
								body: "Are you sure you want to grant admin to these users?",
								okButton: {
									label: "Grant admin",
									onClick: async () => {
										const users = selectedRows.map((row) => row.original);
										const userIds = users.map((user) => user.id);
										const result = await userIsAdminSetMany.execute(
											userIds,
											true,
										);
										if (result.err) throw new Error("Not implemented");

										for (const user of users) {
											user.isAdmin.value = true;
										}
									},
								},
							}}
						>
							Grant admin
						</DangerButton>
					</div>

					<DangerButton
						disabled={!hasSelectedRows}
						dialog={{
							title: "Delete",
							body: "Are you sure you want to delete these users?",
							okButton: {
								label: "Delete",
								onClick: async () => {
									const users = selectedRows.map((row) => row.original);
									const userIds = users.map((user) => user.id);
									const result = await userDeleteMany.execute(userIds);
									if (result.err) throw new Error("Not implemented");

									refreshData();
								},
							},
						}}
					>
						Delete
					</DangerButton>
				</div>
			</div>
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
			<div className="flex items-center mx-auto mt-2 space-x-2">
				{paginationItems.includes(1) ? (
					<div className="w-12 h-10"></div>
				) : (
					<Button
						size="icon"
						variant="ghost"
						disabled={pageN === 1}
						onClick={() => setPageN(1)}
					>
						1
					</Button>
				)}
				{paginationItems.map((page, index) =>
					page < 1 || page > lastPageN ? (
						<div key={index} className="w-12 h-10"></div>
					) : (
						<Button
							key={index}
							variant={pageN === page ? "secondary" : "ghost"}
							size="icon"
							onClick={() => setPageN(page as number)}
							disabled={page === pageN}
						>
							{page}
						</Button>
					),
				)}
				{paginationItems.includes(lastPageN) ? (
					<div className="w-12 h-10"></div>
				) : (
					<Button
						size="icon"
						variant="ghost"
						disabled={pageN === lastPageN}
						onClick={() => setPageN(lastPageN)}
					>
						{lastPageN}
					</Button>
				)}

				<GoToPage setPageN={setPageN} lastPageN={lastPageN} />
			</div>
		</div>
	);
}

function GoToPage({
	setPageN,
	lastPageN,
}: {
	lastPageN: number;
	setPageN: (n: number) => void;
}) {
	const [input, setInput] = useState("");

	return (
		<form
			className="flex space-x-2"
			onSubmit={(e) => {
				e.preventDefault();
				const n = parseInt(input);
				const isValid = !isNaN(n) && n >= 1 && n <= lastPageN;
				if (!isValid) {
					alert("Please input a number between 1 and " + lastPageN);
					return;
				}

				setPageN(n);
			}}
		>
			<Input
				placeholder="Page"
				className="px-1 w-14"
				required
				value={input}
				onChange={(e) => setInput(e.target.value)}
			/>
			<Button variant="secondary">Go</Button>
		</form>
	);
}
