import { PrismaClient, Topic as PrismaTopic } from "@prisma/client";
import { Result, Err, Ok } from "ts-results";
import { Topic } from "..";
import { Failure, NotFoundFailure } from "../../utils/failure";

export { Topic as PrismaTopic } from "@prisma/client";

export interface TopicRepository {
	get(id: string): Promise<Result<Topic, Failure>>;
}

class PrismaTopicRepository implements TopicRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async get(id: string): Promise<Result<Topic, Failure>> {
		const prismaTopic = await this.prisma.topic.findUnique({ where: { id } });
		if (!prismaTopic) return Err(new NotFoundFailure());

		const topic: Topic = prismaTopicToEntity(prismaTopic);

		return Ok(topic);
	}
}

export function prismaTopicToEntity(model: PrismaTopic) {
	return model;
}
