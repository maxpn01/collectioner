import { None, Option, Some } from "ts-results";

export function nullableToOption<T>(x: T | null | undefined): Option<T> {
	return x === null || x === undefined ? None : Some(x);
}
