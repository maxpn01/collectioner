import { Ok, Option, Result } from "ts-results";
import { Failure } from "../utils/failure";
import { CollectionRepository } from "./repositories/collection";

type ViewCollectionResponse = {
	id: string;
	name: string;
	imageOption: Option<string>;
	owner: {
		id: string;
		username: string;
		fullname: string;
	};
	topic: {
		id: string;
		name: string;
	};
	fields: {
		id: string;
		name: string;
		type: CollectionFieldType;
	}[];
	items: {
		id: string;
		name: string;
		tags: Set<string>;
		createdAt: Date;
	}[];
	size: number;
};

export class ViewCollectionUseCase {
	collectionRepository: CollectionRepository;

	constructor(collectionRepository: CollectionRepository) {
		this.collectionRepository = collectionRepository;
	}

	async execute(id: string): Promise<Result<ViewCollectionResponse, Failure>> {
		const collectionResult = await this.collectionRepository.get(id, {
			include: { items: true, fields: true },
		});
		if (collectionResult.err) return collectionResult;
		const { collection, items, fields } = collectionResult.val;

		const itemsResponse = items.map((item) => ({
			id: item.id,
			name: item.name,
			tags: item.tags,
			createdAt: item.createdAt,
		}));

		return Ok({
			items: itemsResponse,
			id: collection.id,
			owner: {
				id: collection.owner.id,
				username: collection.owner.username,
				fullname: collection.owner.fullname,
			},
			fields,
			name: collection.name,
			topic: collection.topic,
			imageOption: collection.imageOption,
			size: itemsResponse.length,
		});
	}
}

export function viewCollectionHttpBodyPresenter(
	response: ViewCollectionResponse,
): any {
	return {
		id: response.id,
		name: response.name,
		imageOption: response.imageOption,
		owner: response.owner,
		topic: response.topic,
		fields: response.fields,
		items: response.items.map((item) => ({
			id: item.id,
			name: item.name,
			tags: Array.from(item.tags),
			createdAt: item.createdAt,
		})),
		size: response.size,
	};
}

import { Request, Response } from "express";
import { idController } from "../utils/id";
import { expressSendHttpFailure, httpFailurePresenter } from "../http";
import { CollectionFieldType } from ".";

export class ExpressViewCollection {
	viewCollection: ViewCollectionUseCase;

	constructor(viewCollection: ViewCollectionUseCase) {
		this.execute = this.execute.bind(this);
		this.viewCollection = viewCollection;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = idController(req.query.id);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const id = controllerResult.val;

		const viewCollecitonResult = await this.viewCollection.execute(id);
		if (viewCollecitonResult.err) {
			const failure = viewCollecitonResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const collection = viewCollecitonResult.val;

		const httpBodyCollection = viewCollectionHttpBodyPresenter(collection);

		res.status(200).json(httpBodyCollection);
	}
}
