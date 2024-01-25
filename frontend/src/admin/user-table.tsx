import { Button } from "@/components/button";
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

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function UserTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const hasSelectedRows = selectedRows.length > 0;

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
						>
							Block
						</Button>
						<Button
							size="sm"
							variant="outline"
							className=""
							disabled={!hasSelectedRows}
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
						>
							Revoke admin
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="text-red-500 border-red-500 hover:text-red-500 hover:bg-red-50"
							disabled={!hasSelectedRows}
						>
							Grant admin
						</Button>
					</div>

					<Button
						size="sm"
						variant="outline"
						className="text-red-500 border-red-500 hover:text-red-500 hover:bg-red-50"
						disabled={!hasSelectedRows}
					>
						Delete
					</Button>
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
