import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { Checkbox } from "@/components/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/form";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Textarea } from "@/components/textarea";
import { DeepPartial } from "@/utils/generics";
import { cn } from "@/utils/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Xmark } from "iconoir-react";
import { CalendarIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { UseFormReturn, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

export type FormItemField<T extends number | string | boolean | Date> = {
	collectionFieldId: string;
	name: string;
	value: T;
};

export type UiItemForm = {
	name: string;
	tags: { value: string }[];
	numberFields: FormItemField<number>[];
	textFields: FormItemField<string>[];
	multilineTextFields: FormItemField<string>[];
	checkboxFields: FormItemField<boolean>[];
	dateFields: FormItemField<Date>[];
};

const itemSchema = z.object({
	name: z.string(),
	textFields: z.array(
		z.object({
			value: z.string(),
		}),
	),
	numberFields: z.array(
		z.object({
			value: z.any().refine((val) => !Number.isNaN(parseInt(val, 10)), {
				message: "Please enter a number",
			}),
		}),
	),
	multilineTextFields: z.array(
		z.object({
			value: z.string(),
		}),
	),
	checkboxFields: z.array(
		z.object({
			value: z.boolean(),
		}),
	),
	dateFields: z.array(
		z.object({
			value: z.date(),
		}),
	),
});

export function ItemForm({
	defaultValues,
	onSubmit,
}: {
	defaultValues: DeepPartial<UiItemForm>;
	onSubmit: (form: UiItemForm) => void;
}) {
	const form = useForm<UiItemForm>({
		resolver: zodResolver(itemSchema),
		defaultValues,
	});
	const [tags, setTagsState] = useState<string[]>(
		(defaultValues.tags ?? []).map((t) => t!.value!),
	);
	const setTags = useCallback((tags: string[]) => {
		setTagsState(tags);
	}, []);
	const [tagInput, setTagInput] = useState("");
	const { fields: textFields } = useFieldArray({
		name: "textFields",
		control: form.control,
	});
	const { fields: dateFields } = useFieldArray({
		name: "dateFields",
		control: form.control,
	});
	const { fields: numberFields } = useFieldArray({
		name: "numberFields",
		control: form.control,
	});
	const { fields: checkboxFields } = useFieldArray({
		name: "checkboxFields",
		control: form.control,
	});
	const { fields: multilineTextFields } = useFieldArray({
		name: "multilineTextFields",
		control: form.control,
	});

	return (
		<Form {...form}>
			<form
				className="space-y-8"
				onSubmit={form.handleSubmit((form) =>
					onSubmit({ ...form, tags: tags.map((tag) => ({ value: tag })) }),
				)}
			>
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold text-slate-800">Item</h1>

					<Button>Save</Button>
				</div>

				<FormField
					name="name"
					render={({ field, fieldState }) => (
						<FormItem className="mb-4">
							<FormLabel className="pl-2 font-bold text-slate-600">
								Name
							</FormLabel>
							<FormControl>
								<Input className="w-60" {...field} value={field.value ?? ""} />
							</FormControl>
							{fieldState.error && (
								<FormMessage className="pl-2">
									{fieldState.error.message}
								</FormMessage>
							)}
						</FormItem>
					)}
				/>

				<div>
					<h4 className="mb-2 text-sm font-semibold text-slate-600">Tags</h4>

					<div className="flex gap-2">
						{tags.map((tag) => (
							<Button
								key={tag}
								variant="outline"
								size="sm"
								className="pr-2"
								type="button"
								onClick={() => {
									setTags(tags.filter((t) => t !== tag));
								}}
							>
								{tag}
								<Xmark className="ml-2" />
							</Button>
						))}
					</div>

					<div className="flex gap-2 mt-2">
						<Input
							className="inline-block w-40"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value.trim())}
						/>
						<Button
							type="button"
							variant="secondary"
							withIcon
							onClick={() => {
								setTags([...tags, tagInput]);
								setTagInput("");
							}}
							disabled={tagInput.length === 0 || tags.includes(tagInput)}
						>
							<Plus className="mr-2" />
							Add tag
						</Button>
					</div>
				</div>

				{textFields.map((_, index) => (
					<TextItemField
						key={defaultValues.textFields![index]!.collectionFieldId!}
						label={defaultValues.textFields![index]!.name!}
						index={index}
					/>
				))}
				{dateFields.map((_, index) => (
					<DateItemField
						key={defaultValues.dateFields![index]!.collectionFieldId!}
						label={defaultValues.dateFields![index]!.name!}
						index={index}
						form={form}
					/>
				))}
				{numberFields.map((_, index) => (
					<NumberItemField
						key={defaultValues.numberFields![index]!.collectionFieldId!}
						label={defaultValues.numberFields![index]!.name!}
						index={index}
					/>
				))}
				{checkboxFields.length > 0 && (
					<div>
						<h4 className="pl-2 mb-4 text-sm font-bold text-slate-600">
							Checkbox fields
						</h4>
						{checkboxFields.map((field, index) => (
							<CheckboxItemField
								key={defaultValues.checkboxFields![index]!.collectionFieldId!}
								label={defaultValues.checkboxFields![index]!.name!}
								index={index}
								onClick={() => {
									form.setValue(`checkboxFields.${index}.value`, !field.value);
								}}
							/>
						))}
					</div>
				)}
				{multilineTextFields.map((_, index) => (
					<MultilineTextItemField
						key={defaultValues.multilineTextFields![index]!.collectionFieldId!}
						label={defaultValues.multilineTextFields![index]!.name!}
						index={index}
					/>
				))}
			</form>
		</Form>
	);
}

function TextItemField({ label, index }: { label: string; index: number }) {
	return (
		<FormField
			name={`textFields.${index}.value`}
			render={({ field, fieldState }) => (
				<FormItem className="mb-4">
					<FormLabel className="pl-2 font-bold text-slate-600">
						{label}
					</FormLabel>
					<FormControl>
						<Input className="w-60" {...field} value={field.value ?? ""} />
					</FormControl>
					{fieldState.error && (
						<FormMessage className="pl-2">
							{fieldState.error.message}
						</FormMessage>
					)}
				</FormItem>
			)}
		/>
	);
}

function DateItemField({
	label,
	index,
	form,
}: {
	label: string;
	index: number;
	form: UseFormReturn<UiItemForm>;
}) {
	return (
		<FormField
			name={`dateFields.${index}.value`}
			render={({ field, fieldState }) => (
				<FormItem className="mb-4">
					<FormLabel className="block pl-2 font-bold text-slate-600">
						{label}
					</FormLabel>
					<FormControl>
						<DateField
							value={field.value}
							onSelect={(date) => {
								if (!date) return;
								form.setValue(`dateFields.${index}.value`, date);
								form.trigger(`dateFields.${index}.value`);
							}}
						/>
					</FormControl>
					{fieldState.error && (
						<FormMessage className="pl-2">
							{fieldState.error.message}
						</FormMessage>
					)}
				</FormItem>
			)}
		/>
	);
}

function DateField({
	value,
	onSelect,
}: {
	value: Date | undefined;
	onSelect: (d: Date | undefined) => void;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-[280px] justify-start text-left font-normal",
						!value && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="w-4 h-4 mr-2" />
					{value ? format(value, "PPP") : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="single"
					selected={value}
					onSelect={onSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

function NumberItemField({ label, index }: { label: string; index: number }) {
	return (
		<FormField
			name={`numberFields.${index}.value`}
			render={({ field, fieldState }) => (
				<FormItem className="mb-4">
					<FormLabel className="pl-2 font-bold text-slate-600">
						{label}
					</FormLabel>
					<FormControl>
						<Input
							className="w-60"
							{...field}
							value={field.value ?? ""}
							type="number"
						/>
					</FormControl>
					{fieldState.error && (
						<FormMessage className="pl-2">
							{fieldState.error.message}
						</FormMessage>
					)}
				</FormItem>
			)}
		/>
	);
}

function CheckboxItemField({
	label,
	index,
	onClick,
}: {
	label: string;
	index: number;
	onClick: () => void;
}) {
	return (
		<FormField
			name={`checkboxFields.${index}.value`}
			render={({ field, fieldState }) => (
				<FormItem className="mb-4">
					<FormControl>
						<Label className="flex items-center pl-2 gap-x-2">
							<Checkbox
								{...field}
								defaultChecked={field.value}
								onClick={onClick}
							/>
							{label}
						</Label>
					</FormControl>
					{fieldState.error && (
						<FormMessage className="pl-2">
							{fieldState.error.message}
						</FormMessage>
					)}
				</FormItem>
			)}
		/>
	);
}

function MultilineTextItemField({
	label,
	index,
}: {
	label: string;
	index: number;
}) {
	return (
		<FormField
			name={`multilineTextFields.${index}.value`}
			render={({ field, fieldState }) => (
				<FormItem className="mb-4">
					<FormLabel className="pl-2 font-bold text-slate-600">
						{label}
					</FormLabel>
					<FormControl>
						<Textarea
							className="h-48 max-w-full w-2xl"
							{...field}
							value={field.value ?? ""}
						/>
					</FormControl>
					{fieldState.error && (
						<FormMessage className="pl-2">
							{fieldState.error.message}
						</FormMessage>
					)}
				</FormItem>
			)}
		/>
	);
}
