import { Result, Ok, Err } from "ts-results";
import { BadRequestFailure, Failure } from "../../utils/failure";
import { PrismaClient } from "@prisma/client";

export interface TagsRepository {
	getAll(): Promise<Result<Set<string>, Failure>>;
	getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>>;
}

export class PrismaTagsRepository implements TagsRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async getAll(): Promise<Result<Set<string>, Failure>> {
		const prismaItemTags = await this.prisma.itemTag.findMany();

		const tags = new Set<string>();

		prismaItemTags.forEach((itemTag) => {
			tags.add(itemTag.tag);
		});

		return Ok(tags);
	}

	async getTagsThatStartWith(s: string): Promise<Result<Set<string>, Failure>> {
		const prismaItemTags = await this.prisma.itemTag.findMany({
			where: {
				tag: {
					startsWith: s,
				},
			},
			take: 10,
		});

		const tags = new Set<string>();

		prismaItemTags.forEach((itemTag, index) => {
			tags.add(itemTag.tag);
		});

		return Ok(tags);
	}
}

type AutocompleteTagsRequest = {
	s: string;
};
type AutocompleteTagsResponse = {
	tags: Set<string>;
};

export class AutocompleteTagsUseCase {
	tagsRepository: TagsRepository;

	constructor(tagsRepository: TagsRepository) {
		this.tagsRepository = tagsRepository;
	}

	async execute(
		request: AutocompleteTagsRequest,
	): Promise<Result<AutocompleteTagsResponse, Failure>> {
		const tagsResult = await this.tagsRepository.getTagsThatStartWith(
			request.s,
		);
		if (tagsResult.err) return tagsResult;
		const tags = tagsResult.val;

		return Ok({ tags });
	}
}

export function jsonAutocompleteTagsController(
	s: any,
): Result<AutocompleteTagsRequest, BadRequestFailure> {
	const sResult = s.trim();
	if (sResult.length === 0) return Err(new BadRequestFailure());

	return Ok({ s: sResult });
}

export function viewItemHttpBodyPresenter(response: AutocompleteTagsResponse) {
	return {
		tags: Array.from(response.tags),
	};
}

import { Request, Response } from "express";
import { expressSendHttpFailure, httpFailurePresenter } from "../../http";

export class ExpressAutocompleteTags {
	autocompleteTags: AutocompleteTagsUseCase;

	constructor(autocompleteTags: AutocompleteTagsUseCase) {
		this.execute = this.execute.bind(this);
		this.autocompleteTags = autocompleteTags;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = jsonAutocompleteTagsController(req.query.s);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const stringRequest = controllerResult.val;

		const autocompleteTagsResult = await this.autocompleteTags.execute(
			stringRequest,
		);
		if (autocompleteTagsResult.err) {
			const failure = autocompleteTagsResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const tags = autocompleteTagsResult.val;

		const httpBodyTags = viewItemHttpBodyPresenter(tags);

		res.status(200).json(httpBodyTags);
	}
}
