import { Result, Ok } from "ts-results";
import { Failure } from "../../utils/failure";

export interface TagsRepository {
	getAll(): Promise<Result<Set<string>, Failure>>;
	getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>>;
}

export class AutocompleteTagsUseCase {
	tagsRepository: TagsRepository;

	constructor(tagsRepository: TagsRepository) {
		this.tagsRepository = tagsRepository;
	}

	async execute(s: string): Promise<Result<Set<string>, Failure>> {
		const tagsResult = await this.tagsRepository.getTagsThatStartWith(s);
		if (tagsResult.err) return tagsResult;
		const tags = tagsResult.val;

		return Ok(tags);
	}
}
