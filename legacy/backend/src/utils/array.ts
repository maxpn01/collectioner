export function areArraysEqual<T>(arr1: T[], arr2: T[]): boolean {
	if (arr1.length !== arr2.length) return false;

	for (let elem of arr1) {
		if (!arr2.includes(elem)) {
			return false;
		}
	}

	return true;
}

export function uniqueBy<T, U>(
	selectUniqueProperty: (t: T) => U,
	arr: T[],
): T[] {
	let uniquePropertySet = new Set(arr.map(selectUniqueProperty));

	return [...uniquePropertySet].map(
		(prop) => arr.find((item) => selectUniqueProperty(item) === prop)!,
	);
}
