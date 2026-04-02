import { expressApp } from "../http";
import {
	CreateCommentUseCase,
	ExpressCreateComment,
} from "../../collection/item/comment/create-comment";
import { requireAuth } from "../middleware/auth";
import { prismaUserRepository } from "../user";
import { prismaItemRepository } from "./item";
import { PrismaCommentRepository } from "../../collection/item/comment";
import { MeiliCommentSearchEngine } from "../../collection/item/comment/search-engine";
import { meili } from "../meili";
import {
	DeleteCommentUseCase,
	ExpressDeleteComment,
} from "../../collection/item/comment/delete-comment";
import {
	ExpressUpdateComment,
	UpdateCommentUseCase,
} from "../../collection/item/comment/update-comment";

const commentSearchEngine = new MeiliCommentSearchEngine(meili);
export const prismaCommentRepository = new PrismaCommentRepository();

const createComment = new CreateCommentUseCase(
	prismaUserRepository,
	prismaItemRepository,
	prismaCommentRepository,
	commentSearchEngine,
);
const expressCreateComment = new ExpressCreateComment(createComment);
expressApp.post("/api/comment", requireAuth, expressCreateComment.execute);

const deleteComment = new DeleteCommentUseCase(
	prismaUserRepository,
	prismaCommentRepository,
	commentSearchEngine,
);
const expressDeleteComment = new ExpressDeleteComment(deleteComment);
expressApp.delete("/api/comment", requireAuth, expressDeleteComment.execute);

const updateComment = new UpdateCommentUseCase(
	prismaUserRepository,
	prismaCommentRepository,
	commentSearchEngine,
);
const expressUpdateComment = new ExpressUpdateComment(updateComment);
expressApp.put("/api/comment", requireAuth, expressUpdateComment.execute);
