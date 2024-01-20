import { describe, expect, it, beforeEach } from "vitest";
import { Some, None, Ok } from "ts-results";
import { UserRepository } from "../user";
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
import { CollectionRepository } from "./repositories/collection";
import {
	UpdateCollectionRequest,
	UpdateCollectionRequestField,
	UpdateCollectionRequestNewField,
	UpdateCollectionUseCase,
} from "./update-collection";
import { TopicRepository } from "./repositories/topic";
import {
	CollectionFieldRepository,
	UpdatedField,
} from "./repositories/collection-field";
import { Collection, CollectionField, CollectionFieldType } from ".";
import { CollectionSearchEngine } from "./search-engine";
import { NotAuthorizedFailure } from "../utils/failure";

describe("update collection use case", () => {
	let updateCollection: UpdateCollectionUseCase;

	const MockTopicRepo = mock<TopicRepository>();
	const MockUserRepo = mock<UserRepository>();
	const MockCollectionRepo = mock<CollectionRepository>();
	const MockCollectionFieldRepo = mock<CollectionFieldRepository>();
	const MockCollectionSearchEngine = mock<CollectionSearchEngine>();

	const bookTopic = createTestTopic("books");

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

	const admin = createTestUser("admin");
	admin.isAdmin = true;

	const updatedCollection: Collection = {
		owner: john,
		id: johnCollection.id,
		name: "top50fantasy",
		topic: bookTopic,
		imageOption: Some("image"),
	};

	const numberField: UpdateCollectionRequestField = {
		id: "pages",
		name: "Pages",
		type: CollectionFieldType.Number,
	};
	const textField: UpdateCollectionRequestField = {
		id: "author",
		name: "Author",
		type: CollectionFieldType.Text,
	};
	const multilineTextField: UpdateCollectionRequestField = {
		id: "description",
		name: "Description",
		type: CollectionFieldType.MultilineText,
	};
	const checkboxField: UpdateCollectionRequestField = {
		id: "read",
		name: "Read",
		type: CollectionFieldType.Checkbox,
	};
	const dateField: UpdateCollectionRequestField = {
		id: "published",
		name: "Published",
		type: CollectionFieldType.Date,
	};

	const collectionFieldsRequest: UpdateCollectionRequestField[] = [
		numberField,
		textField,
		multilineTextField,
		checkboxField,
		dateField,
	];

	const newNumberField: UpdateCollectionRequestNewField = {
		name: "Pages",
		type: CollectionFieldType.Number,
	};
	const newTextField: UpdateCollectionRequestNewField = {
		name: "Author",
		type: CollectionFieldType.Text,
	};
	const newMultilineTextField: UpdateCollectionRequestNewField = {
		name: "Description",
		type: CollectionFieldType.MultilineText,
	};
	const newCheckboxField: UpdateCollectionRequestNewField = {
		name: "Read",
		type: CollectionFieldType.Checkbox,
	};
	const newDateField: UpdateCollectionRequestNewField = {
		name: "Published",
		type: CollectionFieldType.Date,
	};

	const newCollectionFieldsRequest: UpdateCollectionRequestNewField[] = [
		newNumberField,
		newTextField,
		newMultilineTextField,
		newCheckboxField,
		newDateField,
	];

	const updatedCollectionRequest: UpdateCollectionRequest = {
		name: updatedCollection.name,
		topicId: updatedCollection.topic.id,
		imageOption: updatedCollection.imageOption,
		fields: collectionFieldsRequest,
		newFields: newCollectionFieldsRequest,
	};

	const collectionNumberField: CollectionField = {
		id: numberField.id,
		name: newNumberField.name,
		collection: johnCollection,
		type: numberField.type,
	};
	const collectionTextField: CollectionField = {
		id: textField.id,
		name: newTextField.name,
		collection: johnCollection,
		type: textField.type,
	};
	const collectionMultilineTextField: CollectionField = {
		id: multilineTextField.id,
		name: newMultilineTextField.name,
		collection: johnCollection,
		type: multilineTextField.type,
	};
	const collectionCheckboxField: CollectionField = {
		id: checkboxField.id,
		name: newCheckboxField.name,
		collection: johnCollection,
		type: checkboxField.type,
	};
	const collectionDateField: CollectionField = {
		id: dateField.id,
		name: newDateField.name,
		collection: johnCollection,
		type: dateField.type,
	};

	const collectionFields: CollectionField[] = [
		collectionNumberField,
		collectionTextField,
		collectionMultilineTextField,
		collectionCheckboxField,
		collectionDateField,
	];

	const updatedNumberField: UpdatedField = {
		id: collectionNumberField.id,
		field: collectionNumberField,
	};
	const updatedTextField: UpdatedField = {
		id: collectionTextField.id,
		field: collectionTextField,
	};
	const updatedMultilineTextField: UpdatedField = {
		id: collectionMultilineTextField.id,
		field: collectionMultilineTextField,
	};
	const updatedCheckboxField: UpdatedField = {
		id: collectionCheckboxField.id,
		field: collectionCheckboxField,
	};
	const updatedDateField: UpdatedField = {
		id: collectionDateField.id,
		field: collectionDateField,
	};

	const updatedFields: UpdatedField[] = [
		updatedNumberField,
		updatedTextField,
		updatedMultilineTextField,
		updatedCheckboxField,
		updatedDateField,
	];

	const createdNumberField: CollectionField = {
		id: anything(),
		collection: johnCollection,
		name: numberField.name,
		type: numberField.type,
	};
	const createdTextField: CollectionField = {
		id: anything(),
		collection: johnCollection,
		name: textField.name,
		type: textField.type,
	};
	const createdMultilineTextField: CollectionField = {
		id: anything(),
		collection: johnCollection,
		name: multilineTextField.name,
		type: multilineTextField.type,
	};
	const createdCheckboxField: CollectionField = {
		id: anything(),
		collection: johnCollection,
		name: checkboxField.name,
		type: checkboxField.type,
	};
	const createdDateField: CollectionField = {
		id: anything(),
		collection: johnCollection,
		name: dateField.name,
		type: dateField.type,
	};

	const createdFields: CollectionField[] = [
		createdNumberField,
		createdTextField,
		createdMultilineTextField,
		createdCheckboxField,
		createdDateField,
	];

	beforeEach(() => {
		resetCalls(MockTopicRepo);
		when(MockTopicRepo.get(bookTopic.id)).thenResolve(Ok(bookTopic));
		const topicRepo = instance(MockTopicRepo);

		resetCalls(MockUserRepo);
		when(MockUserRepo.get(john.id)).thenResolve(Ok({ user: john }));
		when(MockUserRepo.get(tyler.id)).thenResolve(Ok({ user: tyler }));
		when(MockUserRepo.get(admin.id)).thenResolve(Ok({ user: admin }));
		const userRepo = instance(MockUserRepo);

		resetCalls(MockCollectionRepo);
		when(
			MockCollectionRepo.get(
				johnCollection.id,
				deepEqual({ include: { fields: true } }),
			),
		).thenResolve(Ok({ collection: johnCollection, fields: collectionFields }));
		when(
			MockCollectionRepo.get(
				tylerCollection.id,
				deepEqual({ include: { fields: true } }),
			),
		).thenResolve(
			Ok({ collection: tylerCollection, fields: collectionFields }),
		);
		const collectionRepo = instance(MockCollectionRepo);

		resetCalls(MockCollectionFieldRepo);
		when(
			MockCollectionFieldRepo.updateMany(deepEqual(updatedFields)),
		).thenResolve(Ok(None));
		when(
			MockCollectionFieldRepo.createMany(deepEqual(createdFields)),
		).thenResolve(Ok(None));
		const collectionFieldRepo = instance(MockCollectionFieldRepo);

		resetCalls(MockCollectionSearchEngine);
		when(MockCollectionSearchEngine.add(anything())).thenResolve(Ok(None));
		const collectionSearchEngine = instance(MockCollectionSearchEngine);

		updateCollection = new UpdateCollectionUseCase(
			collectionRepo,
			collectionSearchEngine,
			topicRepo,
			userRepo,
			collectionFieldRepo,
		);
	});

	it("updates a collection", async () => {
		const updateStub = MockCollectionRepo.update(
			johnCollection.id,
			deepEqual(updatedCollection),
		);

		when(updateStub).thenResolve(Ok(None));

		const result = await updateCollection.execute(
			johnCollection.id,
			updatedCollectionRequest,
			john.id,
		);
		if (result.err) throw result;

		verify(updateStub).once();
	});

	it("should allow an admin", async () => {
		const updateStub = MockCollectionRepo.update(
			johnCollection.id,
			deepEqual(updatedCollection),
		);

		when(updateStub).thenResolve(Ok(None));

		const result = await updateCollection.execute(
			johnCollection.id,
			updatedCollectionRequest,
			admin.id,
		);
		if (result.err) throw result;

		verify(updateStub).once();
	});

	it("should not allow another user", async () => {
		const result = await updateCollection.execute(
			johnCollection.id,
			updatedCollectionRequest,
			tyler.id,
		);
		if (result.ok) throw result;
		const failure = result.val;

		verify(MockCollectionRepo.update(anything(), anything())).never();
		expect(failure).toBeInstanceOf(NotAuthorizedFailure);
	});
});
