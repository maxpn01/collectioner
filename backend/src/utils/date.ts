export type UnixTime = number;

export function dateToUnixTime(d: Date): UnixTime {
	return Math.floor(d.getTime() / 1000);
}

export function unixTimeToDate(ut: number): Date {
	return new Date(ut * 1000);
}
