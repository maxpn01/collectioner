import { describe, beforeEach, it } from "vitest";
import { AutocompleteTagsUseCase, TagsRepository } from "./tags";
import { instance, mock, verify, when } from "ts-mockito";
import { Ok } from "ts-results";

describe("tags autocomplete", () => {
	let autocompleteTags: AutocompleteTagsUseCase;

	const MockTagsRepo = mock<TagsRepository>();
	const tags = new Set(["book", "fantasy", "dystopia", "young adult"]);

	beforeEach(() => {
		const tagsRepo = instance(MockTagsRepo);

		autocompleteTags = new AutocompleteTagsUseCase(tagsRepo);
	});

	it("returns all tags that start with a string", async () => {
		const getStub = MockTagsRepo.getTagsThatStartWith("d");

		when(MockTagsRepo.getAll()).thenResolve(Ok(tags));
		when(getStub).thenResolve(Ok(new Set("dystopia")));

		const result = await autocompleteTags.execute("d");
		if (result.err) throw result;

		verify(getStub).once();
	});
});
