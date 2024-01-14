import { PrismaClient } from "@prisma/client";
import { Result, None, Err, Ok } from "ts-results";
import {
	GetCollectionOptions,
	GetCollectionResult,
	Collection,
	prismaCollectionToEntity,
	GetCollectionIncludables,
	prismaCollectionFieldToEntity,
	GetCollectionIncludedProperties,
} from "..";
import { Failure, NotFoundFailure } from "../../utils/failure";
import { optionToNullable } from "../../utils/ts-results";
import { prismaItemToEntity } from "../item";

export interface CollectionRepository {
	get<O extends GetCollectionOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>, Failure>>;
	getByUser<O extends GetCollectionOptions>(
		email: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>[], Failure>>;
	create(collection: Collection): Promise<Result<None, Failure>>;
	update(id: string, collection: Collection): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

class PrismaCollectionRepository implements CollectionRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async get<O extends GetCollectionOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>, Failure>> {
		const prismaItemsInclude = (options?.include?.items && {
			include: {
				tags: options?.include?.items,
			},
		})!;
		const prismaFieldsInclude = options?.include?.fields!;

		const prismaCollection = await this.prisma.collection.findUnique({
			where: { id },
			include: {
				items: prismaItemsInclude,
				collectionFields: prismaFieldsInclude,
				owner: true,
				topic: true,
			},
		});
		if (!prismaCollection) return Err(new NotFoundFailure());

		const collection: Collection = prismaCollectionToEntity(prismaCollection);
		const includables: Partial<GetCollectionIncludables> = {};

		if (options?.include?.items) {
			const prismaItems = prismaCollection.items;
			includables.items = prismaItems.map((pi) =>
				prismaItemToEntity(pi, collection),
			);
		}

		if (options?.include?.fields) {
			const prismaCollectionFields = prismaCollection.collectionFields;
			includables.fields = prismaCollectionFields.map((pcf) =>
				prismaCollectionFieldToEntity(pcf, collection),
			);
		}

		return Ok({
			collection,
			...(includables as GetCollectionIncludedProperties<O>),
		});
	}

	async getByUser<O extends GetCollectionOptions>(
		email: string,
		options?: O,
	): Promise<Result<GetCollectionResult<O>[], Failure>> {
		const prismaItemsInclude = (options?.include?.items && {
			include: {
				tags: options?.include?.items,
			},
		})!;
		const prismaFieldsInclude = options?.include?.fields!;

		const prismaCollections = await this.prisma.collection.findMany({
			where: {
				owner: {
					email,
				},
			},
			include: {
				items: prismaItemsInclude,
				collectionFields: prismaFieldsInclude,
				owner: true,
				topic: true,
			},
		});
		if (!prismaCollections) return Err(new NotFoundFailure());

		const collections: Collection[] = prismaCollections.map((pc) => {
			return prismaCollectionToEntity(pc);
		});
		const includables: Partial<GetCollectionIncludables> = {};

		if (options?.include?.items) {
			const prismaItems = prismaCollections.flatMap((pc) => pc.items);
			includables.items = prismaItems.map((pi) =>
				prismaItemToEntity(
					pi,
					collections.find((c) => c.id === pi.collectionId)!,
				),
			);
		}

		if (options?.include?.fields) {
			const prismaCollectionFields = prismaCollections.flatMap(
				(pc) => pc.collectionFields,
			);
			includables.fields = prismaCollectionFields.map((pcf) =>
				prismaCollectionFieldToEntity(
					pcf,
					collections.find((c) => c.id === pcf.collectionId)!,
				),
			);
		}

		return Ok(
			collections.map((c) => ({
				collection: c,
				...(includables as GetCollectionIncludedProperties<O>),
			})),
		);
	}

	async create(collection: Collection): Promise<Result<None, Failure>> {
		await this.prisma.collection.create({
			data: {
				id: collection.id,
				name: collection.name,
				image: optionToNullable(collection.imageOption),
				userId: collection.owner.id,
				topicId: collection.topic.id,
			},
		});

		return Ok(None);
	}

	async update(
		id: string,
		collection: Collection,
	): Promise<Result<None, Failure>> {
		await this.prisma.collection.update({
			where: { id },
			data: {
				name: collection.name,
				image: optionToNullable(collection.imageOption),
			},
		});

		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		await this.prisma.collection.delete({ where: { id } });

		return Ok(None);
	}
}
