import { PrismaClient } from "@prisma/client";
import { Result, None, Err, Ok } from "ts-results";
import { CollectionField, prismaCollectionFieldToEntity } from "..";
import { Failure, NotFoundFailure } from "../../utils/failure";
import { nullableToOption } from "../../utils/ts-results";

export type UpdatedField = { id: string; field: CollectionField };

export interface CollectionFieldRepository {
	get(id: string): Promise<Result<CollectionField, Failure>>;
	getByCollection(id: string): Promise<Result<CollectionField[], Failure>>;
	has(id: string): Promise<boolean>;
	create(field: CollectionField): Promise<Result<None, Failure>>;
	createMany(fields: CollectionField[]): Promise<Result<None, Failure>>;
	update(id: string, field: CollectionField): Promise<Result<None, Failure>>;
	updateMany(updatedFields: UpdatedField[]): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

class PrismaCollectionFieldRepository implements CollectionFieldRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async get(id: string): Promise<Result<CollectionField, Failure>> {
		const prismaField = await this.prisma.collectionField.findUnique({
			where: { id },
			include: {
				collection: {
					include: {
						owner: true,
						topic: true,
					},
				},
			},
		});
		if (!prismaField) return Err(new NotFoundFailure());

		const field: CollectionField = prismaCollectionFieldToEntity(prismaField, {
			owner: prismaField.collection.owner,
			id: prismaField.collection.id,
			name: prismaField.collection.name,
			topic: prismaField.collection.topic,
			imageOption: nullableToOption(prismaField.collection.image),
		});

		return Ok(field);
	}

	async getByCollection(
		id: string,
	): Promise<Result<CollectionField[], Failure>> {
		const prismaFields = await this.prisma.collectionField.findMany({
			where: { collectionId: id },
			include: {
				collection: {
					include: {
						owner: true,
						topic: true,
					},
				},
			},
		});
		if (!prismaFields) return Err(new NotFoundFailure());

		const fields: CollectionField[] = prismaFields.map((pf) =>
			prismaCollectionFieldToEntity(pf, {
				owner: pf.collection.owner,
				id: pf.collection.id,
				name: pf.collection.name,
				topic: pf.collection.topic,
				imageOption: nullableToOption(pf.collection.image),
			}),
		);

		return Ok(fields);
	}

	async has(id: string): Promise<boolean> {
		const prismaField = await this.prisma.collectionField.findUnique({
			where: { id },
		});
		return !!prismaField;
	}

	async create(field: CollectionField): Promise<Result<None, Failure>> {
		await this.prisma.collectionField.create({
			data: {
				id: field.id,
				name: field.name,
				type: field.type,
				collectionId: field.collection.id,
			},
		});

		return Ok(None);
	}

	async createMany(fields: CollectionField[]): Promise<Result<None, Failure>> {
		await this.prisma.collectionField.createMany({
			data: fields.map((f) => ({
				id: f.id,
				name: f.name,
				type: f.type,
				collectionId: f.collection.id,
			})),
		});

		return Ok(None);
	}

	async update(
		id: string,
		field: CollectionField,
	): Promise<Result<None, Failure>> {
		await this.prisma.collectionField.update({
			where: { id },
			data: {
				name: field.name,
				type: field.type,
			},
		});

		return Ok(None);
	}

	async updateMany(
		updatedFields: UpdatedField[],
	): Promise<Result<None, Failure>> {
		await this.prisma.$transaction(() => {
			return Promise.all(
				updatedFields.map((uf) => {
					this.prisma.collectionField.update({
						where: { id: uf.id },
						data: {
							name: uf.field.name,
							type: uf.field.type,
						},
					});
				}),
			);
		});

		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		await this.prisma.collectionField.delete({ where: { id } });

		return Ok(None);
	}
}
