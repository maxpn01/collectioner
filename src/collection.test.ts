import { describe, expect, it, beforeEach } from "vitest";
import { Some, None, Option } from "ts-results";
import {
	CollectionRepository,
	MemoryCollectionRepository,
	MemoryTopicRepository,
	SetCollectionImageUseCase,
	TopicRepository,
} from "./collection";
import {
	MemoryUserRepository,
	User,
	UserRepository,
	NotAuthorizedFailure,
} from "./user";

const collectionId = "collectionid";
const image = "testfilename.jpg";
const ownerId = "ownerid";
const adminId = "adminid";
const owner: User = {
	id: ownerId,
	email: "",
	fullname: "",
	blocked: false,
	isAdmin: false,
	passwordHash: "",
};

let userRepository: MemoryUserRepository;
let collectionRepository: MemoryCollectionRepository;
let checkRequesterIsAuthenticated: () => boolean;

describe("set collection image use case", () => {
	let setCollectionImage: SetCollectionImageUseCase;

	beforeEach(() => {
		userRepository = new MemoryUserRepository([
			structuredClone(owner),
			{
				id: "anotheruserid",
				email: "",
				fullname: "",
				blocked: false,
				isAdmin: false,
				passwordHash: "",
			},
			{
				id: adminId,
				email: "",
				fullname: "",
				blocked: false,
				isAdmin: true,
				passwordHash: "",
			},
		]);
		checkRequesterIsAuthenticated = () => true;
		const topic = { id: "topicid", name: "" };
		collectionRepository = new MemoryCollectionRepository(
			[
				{
					owner,
					topic,
					id: collectionId,
					name: "",
					items: [],
					imageOption: None,
					numberFields: [],
					textFields: [],
					multilineTextFields: [],
					checkboxFields: [],
					dateFields: [],
				},
			],
			userRepository,
			new MemoryTopicRepository([topic]),
		);
		setCollectionImage = new SetCollectionImageUseCase(
			collectionRepository,
			userRepository,
		);
	});

	it("should allow the owner", async () => {
		await setCollectionImage
			.execute(
				Some(image),
				collectionId,
				ownerId,
				checkRequesterIsAuthenticated,
			)
			.then((result) => result.unwrap());

		const collectionResult = await collectionRepository.get(collectionId);
		const collection = collectionResult.unwrap();
		if (collection.imageOption.none) throw new Error();
		const updatedImage = collection.imageOption.val;
		expect(updatedImage).toBe(image);
	});

	it("should not allow unauthenticated user", async () => {
		checkRequesterIsAuthenticated = () => false;
		const result = await setCollectionImage.execute(
			Some(image),
			collectionId,
			ownerId,
			checkRequesterIsAuthenticated,
		);
		if (result.ok) throw new Error("The user must not be authorized");
		const failure = result.val;

		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});

	it("should not allow another user", async () => {
		const result = await setCollectionImage.execute(
			Some(image),
			collectionId,
			"anotheruserid",
			checkRequesterIsAuthenticated,
		);
		if (result.ok) throw new Error("The user must not be authorized");
		const failure = result.val;

		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});

	it("should allow an admin", async () => {
		await setCollectionImage
			.execute(
				Some(image),
				collectionId,
				adminId,
				checkRequesterIsAuthenticated,
			)
			.then((result) => result.unwrap());

		const collectionResult = await collectionRepository.get(collectionId);
		const collection = collectionResult.unwrap();
		if (collection.imageOption.none) throw new Error();
		const updatedImage = collection.imageOption.val;
		expect(updatedImage).toBe(image);
	});

	it("should remove image", async () => {
		const topic = { id: "topicid", name: "" };
		collectionRepository = new MemoryCollectionRepository(
			[
				{
					owner: structuredClone(owner),
					id: collectionId,
					name: "",
					items: [],
					topic: {
						id: "topicid",
						name: "",
					},
					imageOption: Some(image),
					numberFields: [],
					textFields: [],
					multilineTextFields: [],
					checkboxFields: [],
					dateFields: [],
				},
			],
			userRepository,
			new MemoryTopicRepository([topic]),
		);
		setCollectionImage = new SetCollectionImageUseCase(
			collectionRepository,
			userRepository,
		);

		await setCollectionImage
			.execute(None, collectionId, ownerId, checkRequesterIsAuthenticated)
			.then((result) => result.unwrap());

		const collectionResult = await collectionRepository.get(collectionId);
		const collection = collectionResult.unwrap();
		expect(collection.imageOption.none).toBe(true);
	});
});
