import { describe, expect, it, beforeEach } from "vitest";
import { Some, None } from "ts-results";
import {
	Collection,
	MemoryCollectionRepository,
	MemoryTopicRepository,
	Topic,
} from ".";
import { MemoryUserRepository, User } from "../user";
import { SetCollectionImageUseCase } from "./update-collection";
import { NotAuthorizedFailure } from "../user/view-user";
import { createTestUser } from "../user/index.test";
import { createTestCollection, createTestTopic } from "./index.test";
import { unwrapOption } from "../utils/ts-results";

describe("set collection image use case", () => {
	let setCollectionImage: SetCollectionImageUseCase;
	let checkRequesterIsAuthenticated: () => boolean;

	let users: User[];
	let userRepository: MemoryUserRepository;

	let collections: Collection[];
	let collectionRepository: MemoryCollectionRepository;

	let topics: Topic[];
	let topicRepository: MemoryTopicRepository;

	beforeEach(() => {
		checkRequesterIsAuthenticated = () => true;

		const admin = createTestUser("admin");
		admin.isAdmin = true;
		users = [createTestUser("owner"), createTestUser("notowner"), admin];
		userRepository = new MemoryUserRepository(users);

		topics = [createTestTopic("topic1")];
		topicRepository = new MemoryTopicRepository(topics);

		collections = [createTestCollection("collection1", users[0], topics[0])];
		collectionRepository = new MemoryCollectionRepository(
			collections,
			userRepository,
			topicRepository,
		);

		setCollectionImage = new SetCollectionImageUseCase(
			collectionRepository,
			userRepository,
		);
	});

	it("should allow the owner", async () => {
		await setCollectionImage
			.execute(Some("image"), "collection1", "owner")
			.then((result) => result.unwrap());

		const collectionResult = await collectionRepository.get("collection1");
		const collection = collectionResult.unwrap();
		const updatedImage = unwrapOption(collection.imageOption);
		expect(updatedImage).toBe("image");
	});

	it("should not allow unauthenticated user", async () => {
		checkRequesterIsAuthenticated = () => false;

		const result = await setCollectionImage.execute(
			Some("image"),
			"collection1",
			"owner",
		);
		if (result.ok) throw new Error("The user must not be authorized");
		const failure = result.val;

		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});

	it("should not allow another user", async () => {
		const result = await setCollectionImage.execute(
			Some("image"),
			"collection1",
			"notowner",
		);
		if (result.ok) throw new Error("The user must not be authorized");
		const failure = result.val;

		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});

	it("should allow an admin", async () => {
		await setCollectionImage
			.execute(Some("image"), "collection1", "admin")
			.then((result) => result.unwrap());

		const collectionResult = await collectionRepository.get("collection1");
		const collection = collectionResult.unwrap();
		const updatedImage = unwrapOption(collection.imageOption);
		expect(updatedImage).toBe("image");
	});

	it("should remove image", async () => {
		const initialCollection = createTestCollection(
			"collection1",
			users[0],
			topics[0],
		);
		initialCollection.imageOption = Some("image");
		collections = [initialCollection];
		collectionRepository = new MemoryCollectionRepository(
			collections,
			userRepository,
			topicRepository,
		);
		setCollectionImage = new SetCollectionImageUseCase(
			collectionRepository,
			userRepository,
		);

		await setCollectionImage
			.execute(None, "collection1", "owner")
			.then((result) => result.unwrap());

		const collectionResult = await collectionRepository.get("collection1");
		const collection = collectionResult.unwrap();
		expect(collection.imageOption.none).toBe(true);
	});
});
