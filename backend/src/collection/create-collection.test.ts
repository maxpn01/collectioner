import { beforeEach, describe, expect, it } from "vitest";
import { CreateCollectionUseCase } from "./create-collection";
import { Collection } from ".";
import {
	instance,
	mock,
	verify,
	when,
	deepEqual,
	anything,
	resetCalls,
} from "ts-mockito";
import { UserRepository } from "../user";
import { createTestTopic } from "./index.test";
import { createTestUser } from "../user/index.test";
import { None, Ok } from "ts-results";
import { NotAuthorizedFailure } from "../user/view-user";
import { TopicRepository } from "./repositories/topic";
import { CollectionRepository } from "./repositories/collection";

describe("create collection use case", () => {
	let createCollection: CreateCollectionUseCase;

	const MockTopicRepo = mock<TopicRepository>();
	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();

	const topic = createTestTopic("books");

	const john = createTestUser("john");
	const tyler = createTestUser("tyler");
	const admin = createTestUser("admin");
	admin.isAdmin = true;

	const createCollectionRequest = {
		ownerId: john.id,
		name: "top50fantasy",
		topicId: topic.id,
	};

	const expectedJohnCollection: Collection = {
		owner: john,
		id: anything(),
		name: "top50fantasy",
		topic: topic,
		imageOption: None,
	};

	beforeEach(() => {
		resetCalls(MockTopicRepo);
		const topicRepo = instance(MockTopicRepo);

		resetCalls(MockUserRepo);
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCollectionRepo);
		const collectionRepo = instance(MockCollectionRepo);

		when(MockTopicRepo.get(topic.id)).thenResolve(Ok(topic));

		createCollection = new CreateCollectionUseCase(
			collectionRepo,
			topicRepo,
			userRepo,
		);
	});

	it("creates a collection", async () => {
		const createStub = MockCollectionRepo.create(
			deepEqual(expectedJohnCollection),
		);

		when(MockUserRepo.get(john.id)).thenResolve(Ok({ user: john }));
		when(createStub).thenResolve(Ok(None));

		const result = await createCollection.execute(
			createCollectionRequest,
			john.id,
		);
		if (result.err) throw result;

		verify(createStub).once();
	});

	it("allow admin create collections", async () => {
		const createStub = MockCollectionRepo.create(
			deepEqual(expectedJohnCollection),
		);

		when(MockUserRepo.get(admin.id)).thenResolve(Ok({ user: admin }));
		when(createStub).thenResolve(Ok(None));

		const result = await createCollection.execute(
			createCollectionRequest,
			admin.id,
		);
		if (result.err) throw result;

		verify(createStub).once();
	});

	it("doesn't allow other users create a collection", async () => {
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));

		const result = await createCollection.execute(
			createCollectionRequest,
			tyler.id,
		);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockCollectionRepo.create(anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
