import { Result, Ok, Err } from "ts-results";
import { BadRequestFailure, Failure } from "./failure";

export function idController(id: any): Result<string, Failure> {
	if (typeof id !== "string") return Err(new BadRequestFailure());

	id = id.trim();
	if (id.length === 0) return Err(new BadRequestFailure());

	return Ok(id);
}
