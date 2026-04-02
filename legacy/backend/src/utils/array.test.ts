import { describe, it, expect } from "vitest";
import { uniqueBy } from "./array";

describe("uniqueBy", () => {
	it("creates a unique array based on a property", () => {
		const items = [
			{ id: "a", text: "A" },
			{ id: "b", text: "B" },
			{ id: "a", text: "A" },
		];
		const uniqueItems = uniqueBy((item) => item.id, items);

		expect(uniqueItems).toEqual([
			{ id: "a", text: "A" },
			{ id: "b", text: "B" },
		]);
	});
});
