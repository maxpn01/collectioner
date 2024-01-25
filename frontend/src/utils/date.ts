import { format, formatDistance, isToday } from "date-fns";

export function formatDateRelative(date: Date): string {
	return formatDistance(date, new Date(), { addSuffix: true }).replace(
		"about ",
		"",
	);
}
