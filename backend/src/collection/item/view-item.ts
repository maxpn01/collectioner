import { Result, Ok } from "ts-results";
import { ItemRepository } from ".";
import { CollectionFieldRepository } from "..";
import { Failure } from "../../utils/failure";
import { User } from "../../user";
import { CommentRepository } from "./comments";

type ViewItemResponse = {
	id: string;
	name: string;
	tags: Set<string>;
	fields: {
		numberFields: Map<CollectionFieldId, number>;
		textFields: Map<CollectionFieldId, string>;
		multilineTextFields: Map<CollectionFieldId, string>;
		checkboxFields: Map<CollectionFieldId, boolean>;
		dateFields: Map<CollectionFieldId, Date>;
	};
	comments: {
		id: string;
		author: User;
		text: string;
		createdAt: Date;
	}[];
};

type CollectionFieldId = string;

export class ViewItemUseCase {
	collectionFieldRepository: CollectionFieldRepository;
	itemRepository: ItemRepository;
	commentRepository: CommentRepository;

	constructor(
		collectionFieldRepository: CollectionFieldRepository,
		itemRepository: ItemRepository,
		commentRepository: CommentRepository,
	) {
		this.collectionFieldRepository = collectionFieldRepository;
		this.itemRepository = itemRepository;
		this.commentRepository = commentRepository;
	}

	async execute(id: string): Promise<Result<ViewItemResponse, Failure>> {
		const itemResult = await this.itemRepository.get(id, {
			include: { fields: true, comments: true },
		});
		if (itemResult.err) return itemResult;
		const { item, fields, comments } = itemResult.val;

		return Ok({
			id,
			name: item.name,
			tags: item.tags,
			fields,
			comments,
		});
	}
}
