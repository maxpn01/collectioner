import { Option, None, Some } from "ts-results";

export function unwrapOption<T>(option: Option<T>): T {
	if (option.none) throw new Error("Tried to unwrap None");
	return option.val;
}

export function nullableToOption<T>(x: T | null | undefined): Option<T> {
	return x === null || x === undefined ? None : Some(x);
}

export function optionToNullable<T>(option: Option<T>): T | null | undefined {
	return option.none ? null : option.val;
}
