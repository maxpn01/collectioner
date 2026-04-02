import { describe, beforeEach, it } from "vitest";
import { AutocompleteTagsUseCase, TagsRepository } from "./tags";
import { instance, mock, verify, when, resetCalls } from "ts-mockito";
import { Ok } from "ts-results";

describe("tags autocomplete", () => {
	let autocompleteTags: AutocompleteTagsUseCase;

	const MockTagsRepo = mock<TagsRepository>();

	beforeEach(() => {
		resetCalls(MockTagsRepo);
		const tagsRepo = instance(MockTagsRepo);

		autocompleteTags = new AutocompleteTagsUseCase(tagsRepo);
	});

	it("returns all tags that start with a string", async () => {
		const getStub = MockTagsRepo.getTagsThatStartWith("d");

		when(getStub).thenResolve(Ok(new Set("dystopia")));

		const result = await autocompleteTags.execute("d");
		if (result.err) throw result;

		verify(getStub).once();
	});
});
