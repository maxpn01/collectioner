import { describe, expect, it, beforeEach } from "vitest";
import { Some, None, Ok } from "ts-results";
import { CollectionRepository } from ".";
import { UserRepository } from "../user";
import { SetCollectionImageUseCase } from "./update-collection";
import { NotAuthorizedFailure } from "../user/view-user";
import { createTestUser } from "../user/index.test";
import { createTestCollection, createTestTopic } from "./index.test";
import {
	verify,
	instance,
	mock,
	resetCalls,
	when,
	deepEqual,
	anything,
} from "ts-mockito";

describe("set collection image use case", () => {
	let setCollectionImage: SetCollectionImageUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();

	beforeEach(() => {
		const bookTopic = createTestTopic("books");

		const admin = createTestUser("admin");
		admin.isAdmin = true;

		const john = createTestUser("john");
		const johnCollection = createTestCollection(
			"johncollection",
			john,
			bookTopic,
		);

		const tyler = createTestUser("tyler");
		const tylerCollection = createTestCollection(
			"tylercollection",
			tyler,
			bookTopic,
		);

		resetCalls(MockUserRepo);
		when(MockUserRepo.get("john")).thenResolve(Ok({ user: john }));
		when(MockUserRepo.get("tyler")).thenResolve(Ok({ user: tyler }));
		when(MockUserRepo.get("admin")).thenResolve(Ok({ user: admin }));
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCollectionRepo);
		when(MockCollectionRepo.get("johncollection")).thenResolve(
			Ok({ collection: johnCollection }),
		);
		when(MockCollectionRepo.get("tylercollection")).thenResolve(
			Ok({ collection: tylerCollection }),
		);
		const collectionRepo = instance(MockCollectionRepo);

		setCollectionImage = new SetCollectionImageUseCase(
			collectionRepo,
			userRepo,
		);
	});

	it("should allow the owner", async () => {
		when(
			MockCollectionRepo.updateImage(
				"johncollection",
				deepEqual(Some("image")),
			),
		).thenResolve(Ok(None));

		const result = await setCollectionImage.execute(
			Some("image"),
			"johncollection",
			"john",
		);
		expect(result.ok).toBe(true);

		verify(
			MockCollectionRepo.updateImage(
				"johncollection",
				deepEqual(Some("image")),
			),
		).once();
	});

	it("should allow an admin", async () => {
		when(
			MockCollectionRepo.updateImage(
				"johncollection",
				deepEqual(Some("image")),
			),
		).thenResolve(Ok(None));

		const result = await setCollectionImage.execute(
			Some("image"),
			"johncollection",
			"admin",
		);
		expect(result.ok).toBe(true);

		verify(
			MockCollectionRepo.updateImage(
				"johncollection",
				deepEqual(Some("image")),
			),
		).once();
	});

	it("should not allow another user", async () => {
		const result = await setCollectionImage.execute(
			Some("image"),
			"johncollection",
			"tyler",
		);

		if (result.ok) throw new Error();
		const failure = result.val;

		verify(MockCollectionRepo.updateImage(anything(), anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});

	it("should remove the image", async () => {
		const bookTopic = createTestTopic("books");
		const john = createTestUser("john");
		const johnCollection = createTestCollection(
			"johncollection",
			john,
			bookTopic,
		);
		johnCollection.imageOption = Some("image");

		when(MockCollectionRepo.get("johncollection")).thenResolve(
			Ok({ collection: johnCollection }),
		);

		when(
			MockCollectionRepo.updateImage("johncollection", deepEqual(None)),
		).thenResolve(Ok(None));

		await setCollectionImage.execute(None, "johncollection", "john");

		verify(
			MockCollectionRepo.updateImage("johncollection", deepEqual(None)),
		).once();
	});
});
