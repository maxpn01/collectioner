import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/form";
import { Input } from "@/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/select";
import { UseFormReturn } from "react-hook-form";
import { TopicsState } from "./view-collection";

export function CollectionNameField({
	form,
	defaultValue,
}: {
	form: UseFormReturn<any, any, undefined>;
	defaultValue?: string;
}) {
	return (
		<FormField
			name="name"
			control={form.control}
			defaultValue={defaultValue}
			render={({ field, fieldState }) => (
				<FormItem>
					<FormLabel className="pl-2 font-bold text-slate-600">Name</FormLabel>
					<FormControl>
						<Input
							className="max-w-60"
							placeholder="My favourite books"
							{...field}
							value={field.value ?? ""}
						/>
					</FormControl>
					{fieldState.error && (
						<FormMessage>{fieldState.error.message}</FormMessage>
					)}
				</FormItem>
			)}
		/>
	);
}

export function CollectionTopicField({
	form,
	topics,
	defaultValue,
}: {
	form: UseFormReturn<any, any, undefined>;
	topics: TopicsState;
	defaultValue?: string;
}) {
	return (
		<FormField
			control={form.control}
			name="topicId"
			defaultValue={defaultValue}
			render={({ field, fieldState }) => (
				<FormItem>
					<FormLabel className="pl-2 font-bold text-slate-600">Topic</FormLabel>
					<FormControl>
						<Select value={field.value} onValueChange={field.onChange}>
							<SelectTrigger className="w-60">
								<SelectValue placeholder="Select topic" />
							</SelectTrigger>
							<SelectContent>
								{topics.map((topic) => (
									<SelectItem key={topic.id} value={topic.id}>
										{topic.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormControl>
					{fieldState.error && (
						<FormMessage>{fieldState.error.message}</FormMessage>
					)}
				</FormItem>
			)}
		/>
	);
}
