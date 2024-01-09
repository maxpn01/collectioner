export function areArraysEqual<T>(arr1: T[], arr2: T[]): boolean {
	if (arr1.length !== arr2.length) return false;

	for (let elem of arr1) {
		if (!arr2.includes(elem)) {
			return false;
		}
	}

	return true;
}
