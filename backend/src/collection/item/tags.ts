import { Result, Ok } from "ts-results";
import { Failure } from "../../utils/failure";
import { PrismaClient } from "@prisma/client";

export interface TagsRepository {
	getAll(): Promise<Result<Set<string>, Failure>>;
	getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>>;
}

class PrismaTagsRepository implements TagsRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async getAll(): Promise<Result<Set<string>, Failure>> {
		const prismaItems = await this.prisma.item.findMany({
			select: {
				tags: true,
			},
		});

		const tags = new Set<string>();

		prismaItems.forEach((item) => {
			item.tags.forEach((itemTag) => {
				tags.add(itemTag.tag);
			});
		});

		return Ok(tags);
	}

	async getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>> {
		const prismaItems = await this.prisma.item.findMany({
			where: {
				tags: {
					some: {
						tag: {
							startsWith: s,
						},
					},
				},
			},
			include: {
				tags: true,
			},
		});

		const tags = new Set<string>();

		prismaItems.forEach((item) => {
			item.tags.forEach((itemTag) => {
				tags.add(itemTag.tag);
			});
		});

		return Ok(tags);
	}
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
