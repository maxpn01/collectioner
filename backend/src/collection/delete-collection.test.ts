import { beforeEach, describe, expect, it } from "vitest";
import { DeleteCollectionUseCase } from "./delete-collection";
import { createTestCollection, createTestTopic } from "./index.test";
import { createTestUser } from "../user/index.test";
import { anything, instance, mock, resetCalls, verify, when } from "ts-mockito";
import { UserRepository } from "../user";
import { None, Ok } from "ts-results";
import { CollectionRepository } from "./repositories/collection";
import { CollectionSearchEngine } from "./search-engine";
import { NotAuthorizedFailure } from "../utils/failure";

describe("delete collection use case", () => {
	let deleteCollection: DeleteCollectionUseCase;

	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();
	const MockCollectionSearchEngine = mock<CollectionSearchEngine>();

	const topic = createTestTopic("books");

	const john = createTestUser("john");
	const johnCollection = createTestCollection("johncollection", john, topic);

	const tyler = createTestUser("tyler");
	const admin = createTestUser("admin");
	admin.isAdmin = true;

	beforeEach(() => {
		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCollectionRepo);
		when(MockCollectionRepo.get(johnCollection.id)).thenResolve(
			Ok({ collection: johnCollection }),
		);
		const collectionRepo = instance(MockCollectionRepo);

		resetCalls(MockCollectionSearchEngine);
		when(MockCollectionSearchEngine.add(anything())).thenResolve(Ok(None));
		const collectionSearchEngine = instance(MockCollectionSearchEngine);

		deleteCollection = new DeleteCollectionUseCase(
			collectionRepo,
			collectionSearchEngine,
			userRepo,
		);
	});

	it("deletes a collection", async () => {
		const deleteStub = MockCollectionRepo.delete(johnCollection.id);

		when(MockUserRepo.get(john.id)).thenResolve(Ok({ user: john }));
		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteCollection.execute(johnCollection.id, john.id);
		if (result.err) throw result;

		verify(deleteStub).once();
	});

	it("allow admin delete collections", async () => {
		const deleteStub = MockCollectionRepo.delete(johnCollection.id);

		when(MockUserRepo.get(admin.id)).thenResolve(Ok({ user: admin }));
		when(deleteStub).thenResolve(Ok(None));

		const result = await deleteCollection.execute(johnCollection.id, admin.id);
		if (result.err) throw result;

		verify(deleteStub).once();
	});

	it("doesn't allow other users delete a collection", async () => {
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));

		const result = await deleteCollection.execute(johnCollection.id, tyler.id);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockCollectionRepo.delete(anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
