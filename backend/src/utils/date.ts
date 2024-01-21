export type UnixTime = number;

export function safeDateConversion(value: any): Date {
	// Check if value is already a Date object
	if (value instanceof Date) {
		return value;
	}

	// Attempt to convert to a Date object if it's a string or a number
	if (typeof value === "string" || typeof value === "number") {
		const date = new Date(value);
		if (!isNaN(date.getTime())) {
			return date;
		}
	}

	// If value is not convertible to a valid Date, throw an error
	throw new Error("Invalid date value");
}

export function dateToUnixTime(d: Date): UnixTime {
	return Math.floor(d.getTime() / 1000);
}

export function unixTimeToDate(ut: number): Date {
	return new Date(ut * 1000);
}
