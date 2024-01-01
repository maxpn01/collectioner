import { Result, None, Err, Ok } from "ts-results";
import { Failure, NotFoundFailure } from "./failure";

export interface KeyValueRepository<T> {
	get(key: string): Promise<Result<T, Failure>>;
	set(key: string, value: T): Promise<Result<None, Failure>>;
}

export class MemoryKeyValueRepository<T> implements KeyValueRepository<T> {
	map: Map<string, T>;

	constructor(map: Map<string, T>) {
		this.map = map;
	}

	async get(key: string): Promise<Result<T, Failure>> {
		const value = this.map.get(key);
		if (value === undefined) return Err(new NotFoundFailure());
		return Ok(value);
	}

	async set(key: string, value: T): Promise<Result<None, Failure>> {
		this.map.set(key, value);
		return Ok(None);
	}
}
