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
