export const CollectionFieldType = {
	Number: "Number",
	Text: "Text",
	MultilineText: "MultilineText",
	Checkbox: "Checkbox",
	Date: "Date",
} as const;
export type CollectionFieldType =
	(typeof CollectionFieldType)[keyof typeof CollectionFieldType];
export const collectionFieldTypes: CollectionFieldType[] = [
	"Number",
	"Text",
	"MultilineText",
	"Checkbox",
	"Date",
] as const;

export function collectionLinkPresenter(
	collectionId: string,
	ownerLink: string,
) {
	return `${ownerLink}/${collectionId}`;
}
