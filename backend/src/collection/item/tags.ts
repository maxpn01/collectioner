import { Result, Ok } from "ts-results";
import { ItemRepository } from ".";
import { Failure } from "../../utils/failure";

export interface TagsRepository {
	getAll(): Promise<Result<Set<string>, Failure>>;
	getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>>;
}

export class MemoryTagsRepository implements TagsRepository {
	itemRepository: ItemRepository;

	constructor(itemRepository: ItemRepository) {
		this.itemRepository = itemRepository;
	}

	async getAll(): Promise<Result<Set<string>, Failure>> {
		const itemsResult = await this.itemRepository.getAll();
		if (itemsResult.err) return itemsResult;
		const items = itemsResult.val.map(({ item }) => item);

		const tags = new Set<string>();

		for (const item of items) for (const tag of item.tags) tags.add(tag);

		return Ok(tags);
	}

	async getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>> {
		const tagsResult = await this.getAll();
		if (tagsResult.err) return tagsResult;
		const tags = tagsResult.val;

		for (const tag of tags) if (!tag.startsWith(s)) tags.delete(tag);

		return Ok(tags);
	}
}

export class AutocompleteTagsUseCase {
	tagsRepository: TagsRepository;

	constructor(tagsRepository: TagsRepository) {
		this.tagsRepository = tagsRepository;
	}

	async getAllTags(): Promise<Result<Set<string>, Failure>> {
		const tagsResult = await this.tagsRepository.getAll();
		if (tagsResult.err) return tagsResult;
		const tags = tagsResult.val;

		return Ok(tags);
	}

	async getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>> {
		const tagsResult = await this.tagsRepository.getTagsThatStartWith(s);
		if (tagsResult.err) return tagsResult;
		const tags = tagsResult.val;

		return Ok(tags);
	}
}
