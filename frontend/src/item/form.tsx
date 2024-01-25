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
import { CalendarIcon } from "lucide-react";
import { UseFormReturn, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

export type FormItemField<T extends number | string | boolean | Date> = {
	collectionFieldId: string;
	name: string;
	value: T;
};

type TagInputProps = {
	tags: string[];
	setTags: (tags: string[]) => void;
};

const TagInput: React.FC<TagInputProps> = ({ tags, setTags }) => {
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		// Split the input by commas and trim whitespace
		const newTags = event.target.value.split(",").map((tag) => tag.trim());
		setTags(newTags);
	};

	return (
		<Input
			className="w-60"
			type="text"
			value={tags?.join(", ") || ""}
			onChange={handleInputChange}
		/>
	);
};

export type UiItemForm = {
	name: string;
	tags: string[];
	numberFields: FormItemField<number>[];
	textFields: FormItemField<string>[];
	multilineTextFields: FormItemField<string>[];
	checkboxFields: FormItemField<boolean>[];
	dateFields: FormItemField<Date>[];
};

const itemSchema = z.object({
	name: z.string(),
	tags: z.array(z.string().min(1, "Tag cannot be empty")),
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
	const { register, handleSubmit, setValue, watch } = useForm<UiItemForm>();
	const tags = watch("tags");
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
			<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
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

				<FormField
					name="tags"
					render={({ field, fieldState }) => (
						<FormItem className="mb-4">
							<FormLabel className="pl-2 font-bold text-slate-600">
								Tags
							</FormLabel>
							<FormControl>
								{/* <Input className="w-60" {...field} value={field.value ?? ""} /> */}
								<TagInput
									tags={tags}
									setTags={(newTags) => setValue("tags", newTags)}
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
						{checkboxFields.map((_, index) => (
							<CheckboxItemField
								key={defaultValues.checkboxFields![index]!.collectionFieldId!}
								label={defaultValues.checkboxFields![index]!.name!}
								index={index}
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
								form.trigger();
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

function CheckboxItemField({ label, index }: { label: string; index: number }) {
	return (
		<FormField
			name={`checkboxFields.${index}.value`}
			render={({ field, fieldState }) => (
				<FormItem className="mb-4">
					<FormControl>
						<Label className="flex items-center pl-2 gap-x-2">
							<Checkbox {...field} defaultChecked={field.value} />
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
