import { describe, expect, it, beforeEach } from "vitest";
import { Some, None, Option } from "ts-results";
import {
	CollectionRepository,
	MemoryCollectionRepository,
	SetCollectionImageUseCase,
} from "./collection";
import {
	MemoryUserRepository,
	User,
	UserRepository,
	NotAuthorizedFailure,
} from "./user";

describe("set collection image use case", () => {
	const collectionId = "collectionid";
	const image = "testfilename.jpg";
	const ownerId = "ownerid";
	const adminId = "adminid";

	let checkRequesterIsAuthenticated: () => boolean;
	let userRepository: MemoryUserRepository;
	let collectionRepository: MemoryCollectionRepository;
	let setCollectionImage: SetCollectionImageUseCase;
	const owner: User = {
		id: ownerId,
		email: "",
		fullname: "",
		blocked: false,
		isAdmin: false,
		passwordHash: "",
	};

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
		collectionRepository = new MemoryCollectionRepository(
			[
				{
					owner,
					id: collectionId,
					name: "",
					items: [],
					topic: {
						id: "topicid",
						name: "",
					},
					imageOption: None,
					numberFields: [],
					textFields: [],
					multilineTextFields: [],
					checkboxFields: [],
					dateFields: [],
				},
			],
			userRepository,
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
