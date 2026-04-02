import { Matcher } from "ts-mockito/lib/matcher/type/Matcher";

/**
 * `ts-mockito`'s `deepEqual` matcher, which is based on `lodash`'s `_.isEqualWith` method fails to compare `None` from `ts-results`.
 * The original `deepEqual` matcher may be flawed for other cases as well. This alternative exists for those edge cases.
 */
export function betterDeepEqual<T>(expectedValue: T): T {
	return new BetterDeepEqualMatcher<T>(expectedValue) as any;
}

export class BetterDeepEqualMatcher<T> extends Matcher {
	constructor(private expectedValue: T) {
		super();
	}

	public match(value: any): boolean {
		return this.deepEqual(this.expectedValue, value);
	}

	public toString(): string {
		if (this.expectedValue instanceof Array) {
			return `deepEqual([${this.expectedValue}])`;
		} else {
			return `deepEqual(${this.expectedValue})`;
		}
	}

	deepEqual(a: any, b: any) {
		if (a instanceof Matcher) {
			return a.match(b);
		}

		if (a === b) return true;

		if (
			typeof a !== "object" ||
			a === null ||
			typeof b !== "object" ||
			b === null
		)
			return false;

		let keysA = Object.keys(a),
			keysB = Object.keys(b);

		if (keysA.length !== keysB.length) return false;

		for (let key of keysA) {
			if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) return false;
		}

		return true;
	}
}
