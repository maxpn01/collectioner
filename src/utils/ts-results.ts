import { Option } from "ts-results";

export function unwrapOption<T>(option: Option<T>): T {
	if (option.none) throw new Error("Tried to unwrap None");
	return option.val;
}
