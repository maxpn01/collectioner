import { Result, None, Ok } from "ts-results";
import { MeiliSearch, TaskStatus } from "meilisearch";
import { Comment } from ".";
import { UnixTime, dateToUnixTime } from "../../../utils/date";
import { Failure } from "../../../utils/failure";

export interface CommentSearchEngine {
	add(comment: Comment): Promise<Result<None, Failure>>;
	replace(comment: Comment): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export type CommentDocument = {
	itemId: string;
	id: string;
	text: string;
	createdAt: UnixTime;
};

export const meiliCommentIndex = "comment";

export class MeiliCommentSearchEngine implements CommentSearchEngine {
	meilisearch: MeiliSearch;

	constructor(meilisearch: MeiliSearch) {
		this.meilisearch = meilisearch;
	}

	async add(comment: Comment): Promise<Result<None, Failure>> {
		const document = commentToDocument(comment);
		const task = await this.meilisearch
			.index(meiliCommentIndex)
			.addDocuments([document]);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to add document");

		return Ok(None);
	}

	async replace(comment: Comment): Promise<Result<None, Failure>> {
		// Meilisearch's addDocuments method also replaces the existing documents
		// https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents
		return this.add(comment);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const task = await this.meilisearch
			.index(meiliCommentIndex)
			.deleteDocument(id);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to delete document");

		return Ok(None);
	}
}

export function commentToDocument(comment: Comment): CommentDocument {
	return {
		itemId: comment.item.id,
		id: comment.id,
		text: comment.text,
		createdAt: dateToUnixTime(comment.createdAt),
	};
}
