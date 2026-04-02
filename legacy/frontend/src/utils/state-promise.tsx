import { None, Result, Some } from "ts-results";
import { Failure } from "./failure";
import { ReactNode } from "react";

export type StatePromise<T, E = Failure> = Loading | Loaded<T, E>;

export type Loading = None & {
	loading: true;
	loaded: false;
};
const none: any = structuredClone(None);
none.loading = true;
none.loaded = false;
export const Loading: Loading = none;

export type Loaded<T, E = Failure> = Some<Result<T, E>> & {
	loading: false;
	loaded: true;
};
export const Loaded = <T, E = Failure>(result: Result<T, E>): Loaded<T, E> => {
	const x: any = Some(result);
	x.loading = false;
	x.loaded = true;
	return x;
};

export function LoadingIndicator() {
	return <>Loading...</>;
}

export function ErrorIndicator(props: { children?: ReactNode }) {
	if (!props.children) return <>Error</>;

	return <>Error: {props.children}</>;
}
