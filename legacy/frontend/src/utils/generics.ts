declare const $NestedValue: unique symbol;

export type BrowserNativeObject = Date | FileList | File;
export type NestedValue<TValue extends object = object> = {
	[$NestedValue]: never;
} & TValue;

export type DeepPartial<T> = T extends BrowserNativeObject | NestedValue
	? T
	: {
			[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
		};
